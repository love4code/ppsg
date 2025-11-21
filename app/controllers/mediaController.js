const Media = require('../models/Media');
const sharp = require('sharp');

// Process and save image in multiple sizes with compression
const processImage = async (buffer) => {
  const sizes = {
    thumbnail: { width: 300, quality: 80 },
    medium: { width: 800, quality: 85 },
    large: { width: 1200, quality: 90 },
  };

  const processed = {};
  
  for (const [size, config] of Object.entries(sizes)) {
    // Resize and compress image
    const image = await sharp(buffer)
      .resize(config.width, null, { 
        withoutEnlargement: true,
        fit: 'inside'
      })
      .jpeg({ 
        quality: config.quality,
        progressive: true,
        mozjpeg: true // Better compression
      })
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

    // Don't load Buffer data in list view to save memory
    const media = await Media.find(query)
      .select('-sizes.thumbnail.data -sizes.medium.data -sizes.large.data')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Media.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    // Construct base URL for image links
    const baseUrl = `${req.protocol}://${req.get('host')}`;

    res.render('admin/media/index', {
      media,
      currentPage: page,
      totalPages,
      search,
      baseUrl, // Pass base URL for image links
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
      try {
        const processedSizes = await processImage(file.buffer);
        
        // Validate that we have image data
        if (!processedSizes.thumbnail || !processedSizes.thumbnail.data) {
          throw new Error('Failed to process image');
        }
        
        // Calculate total size to check MongoDB 16MB limit
        const totalSize = (processedSizes.thumbnail.data.length + 
                          processedSizes.medium.data.length + 
                          processedSizes.large.data.length) / (1024 * 1024); // Size in MB
        
        if (totalSize > 15) { // Leave some room under 16MB limit
          throw new Error(`Image too large (${totalSize.toFixed(2)}MB). Total size must be under 15MB.`);
        }
        
        const media = new Media({
          originalFilename: file.originalname,
          title: file.originalname.replace(/\.[^/.]+$/, ''),
          mimeType: file.mimetype,
          sizes: processedSizes,
        });

        const savedMedia = await media.save();
        
        // Verify the data was saved by checking one size
        const verifyMedia = await Media.findById(savedMedia._id);
        if (!verifyMedia || !verifyMedia.sizes.thumbnail || !Buffer.isBuffer(verifyMedia.sizes.thumbnail.data)) {
          throw new Error('Image data not properly saved to database');
        }
        
        console.log(`Image saved successfully: ${savedMedia._id}, total size: ${totalSize.toFixed(2)}MB`);
        return savedMedia;
      } catch (error) {
        console.error(`Error processing file ${file.originalname}:`, error.message || error);
        throw error;
      }
    });

    const savedMedia = await Promise.all(uploadPromises);
    console.log(`Successfully saved ${savedMedia.length} media file(s)`);
    
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
    
    // Support backward compatibility: map 'small' to 'thumbnail', and check both for old media
    let sizeKey = size === 'small' ? 'thumbnail' : size;
    
    // Load all sizes to check for backward compatibility
    const media = await Media.findById(id).select('sizes');
    
    if (!media) {
      console.error(`Media not found: ${id}`);
      return res.status(404).send('Image not found');
    }
    
    // For thumbnail requests, check both 'thumbnail' and 'small' (for old media)
    if (sizeKey === 'thumbnail' && (!media.sizes || !media.sizes.thumbnail || !media.sizes.thumbnail.data)) {
      // Fall back to 'small' if 'thumbnail' doesn't exist (old media)
      if (media.sizes && media.sizes.small && media.sizes.small.data) {
        sizeKey = 'small';
      }
    }
    
    if (!media.sizes || !media.sizes[sizeKey] || !media.sizes[sizeKey].data) {
      console.error(`Size ${sizeKey} not found for media ${id}`);
      return res.status(404).send('Image size not found');
    }

    const imageBuffer = media.sizes[sizeKey].data;
    
    // Ensure it's a Buffer
    if (!Buffer.isBuffer(imageBuffer)) {
      console.error(`Image data is not a Buffer for media ${id}, size ${size}`);
      return res.status(500).send('Invalid image data');
    }

    res.contentType('image/jpeg');
    res.set('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    res.send(imageBuffer);
  } catch (error) {
    console.error('Error loading image:', error);
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
    // Don't load Buffer data to save memory and bandwidth
    const media = await Media.find()
      .select('-sizes.thumbnail.data -sizes.medium.data -sizes.large.data')
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(media);
  } catch (error) {
    console.error('Error fetching media:', error);
    res.status(500).json({ error: 'Error fetching media' });
  }
};

