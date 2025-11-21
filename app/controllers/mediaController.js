const Media = require('../models/Media');
const sharp = require('sharp');

// Process and save image in multiple sizes
const processImage = async (buffer) => {
  const sizes = {
    small: { width: 300 },
    medium: { width: 800 },
    large: { width: 1200 },
  };

  const processed = {};
  
  for (const [size, config] of Object.entries(sizes)) {
    const image = await sharp(buffer)
      .resize(config.width, null, { withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();
    
    const metadata = await sharp(image).metadata();
    
    processed[size] = {
      data: image,
      width: metadata.width,
      height: metadata.height,
    };
  }

  return processed;
};

exports.index = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 24;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    const query = search
      ? {
          $or: [
            { originalFilename: { $regex: search, $options: 'i' } },
            { title: { $regex: search, $options: 'i' } },
          ],
        }
      : {};

    const media = await Media.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Media.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    res.render('admin/media/index', {
      media,
      currentPage: page,
      totalPages,
      search,
    });
  } catch (error) {
    req.session.error = 'Error loading media library';
    res.redirect('/admin');
  }
};

exports.upload = async (req, res) => {
  try {
    // Handle both single file and multiple files
    const files = req.files && req.files.length > 0 ? req.files : (req.file ? [req.file] : []);
    
    if (files.length === 0) {
      if (req.xhr || req.headers.accept && req.headers.accept.indexOf('json') > -1) {
        return res.status(400).json({ error: 'No files uploaded' });
      }
      req.session.error = 'No files uploaded';
      return res.redirect('/admin/media');
    }

    const uploadPromises = files.map(async (file) => {
      const processedSizes = await processImage(file.buffer);
      
      const media = new Media({
        originalFilename: file.originalname,
        title: file.originalname.replace(/\.[^/.]+$/, ''),
        mimeType: file.mimetype,
        sizes: processedSizes,
      });

      return media.save();
    });

    await Promise.all(uploadPromises);
    
    // Return JSON for AJAX requests
    if (req.xhr || req.headers.accept && req.headers.accept.indexOf('json') > -1) {
      return res.json({ 
        success: true, 
        message: `${files.length} file(s) uploaded successfully`,
        count: files.length 
      });
    }
    
    req.session.success = `${files.length} file(s) uploaded successfully`;
    res.redirect('/admin/media');
  } catch (error) {
    console.error('Upload error:', error);
    
    // Return JSON for AJAX requests
    if (req.xhr || req.headers.accept && req.headers.accept.indexOf('json') > -1) {
      return res.status(500).json({ error: 'Error uploading files' });
    }
    
    req.session.error = 'Error uploading files';
    res.redirect('/admin/media');
  }
};

exports.delete = async (req, res) => {
  try {
    await Media.findByIdAndDelete(req.params.id);
    req.session.success = 'Media deleted successfully';
    res.redirect('/admin/media');
  } catch (error) {
    req.session.error = 'Error deleting media';
    res.redirect('/admin/media');
  }
};

exports.getImage = async (req, res) => {
  try {
    const { id, size } = req.params;
    const media = await Media.findById(id);
    
    if (!media || !media.sizes[size]) {
      return res.status(404).send('Image not found');
    }

    res.contentType('image/jpeg');
    res.send(media.sizes[size].data);
  } catch (error) {
    res.status(500).send('Error loading image');
  }
};

exports.show = async (req, res) => {
  try {
    const media = await Media.findById(req.params.id);
    if (!media) {
      req.session.error = 'Media not found';
      return res.redirect('/admin/media');
    }
    res.render('admin/media/show', { media, req });
  } catch (error) {
    req.session.error = 'Error loading media';
    res.redirect('/admin/media');
  }
};

exports.edit = async (req, res) => {
  try {
    const media = await Media.findById(req.params.id);
    if (!media) {
      req.session.error = 'Media not found';
      return res.redirect('/admin/media');
    }
    res.render('admin/media/edit', { media, req });
  } catch (error) {
    req.session.error = 'Error loading media';
    res.redirect('/admin/media');
  }
};

exports.update = async (req, res) => {
  try {
    const { title, altText, description } = req.body;
    
    // Handle metadata - parse key-value pairs from form
    const metadata = {};
    const metadataKeys = {};
    
    // First pass: collect all metadata keys and values
    Object.keys(req.body).forEach(key => {
      if (key.startsWith('metadata_key_')) {
        const index = key.replace('metadata_key_', '');
        metadataKeys[index] = req.body[key];
      } else if (key.startsWith('metadata_value_')) {
        const index = key.replace('metadata_value_', '');
        if (metadataKeys[index] && req.body[key]) {
          metadata[metadataKeys[index]] = req.body[key];
        }
      } else if (key.startsWith('metadata_') && !key.includes('_value')) {
        // Handle existing metadata fields (from edit form)
        const metaKey = key.replace('metadata_', '');
        const valueKey = key + '_value';
        if (req.body[valueKey]) {
          metadata[metaKey] = req.body[valueKey];
        }
      }
    });

    const media = await Media.findByIdAndUpdate(
      req.params.id,
      {
        title: title || '',
        altText: altText || '',
        description: description || '',
        metadata: metadata,
      },
      { new: true, runValidators: true }
    );

    if (!media) {
      req.session.error = 'Media not found';
      return res.redirect('/admin/media');
    }

    req.session.success = 'Media updated successfully';
    res.redirect(`/admin/media/${req.params.id}`);
  } catch (error) {
    console.error('Update media error:', error);
    req.session.error = 'Error updating media';
    res.redirect(`/admin/media/${req.params.id}/edit`);
  }
};

exports.getAll = async (req, res) => {
  try {
    const media = await Media.find().sort({ createdAt: -1 }).limit(100);
    res.json(media);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching media' });
  }
};

