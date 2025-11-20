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
    if (!req.files || req.files.length === 0) {
      req.session.error = 'No files uploaded';
      return res.redirect('/admin/media');
    }

    const uploadPromises = req.files.map(async (file) => {
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
    req.session.success = `${req.files.length} file(s) uploaded successfully`;
    res.redirect('/admin/media');
  } catch (error) {
    console.error('Upload error:', error);
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

exports.getAll = async (req, res) => {
  try {
    const media = await Media.find().sort({ createdAt: -1 }).limit(100);
    res.json(media);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching media' });
  }
};

