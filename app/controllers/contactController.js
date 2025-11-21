const Contact = require('../models/Contact');
const { sendContactEmail } = require('../config/email');

exports.submit = async (req, res) => {
  try {
    const { name, email, phone, message, reason, from, productId, productName, selectedSizes } = req.body;

    if (!name || !email || !message) {
      req.session.error = 'Name, email, and message are required';
      // Redirect back to where form came from
      if (from === 'product' && productId) {
        return res.redirect(`/products/${productId}`);
      }
      return res.redirect(from === 'home' ? '/' : '/contact');
    }

    const contact = new Contact({
      name,
      email,
      phone: phone || '',
      message,
      reason: reason || '',
      productId: productId || undefined,
      productName: productName || '',
      selectedSizes: selectedSizes || '',
    });

    await contact.save();

    // Parse selected sizes for email
    let parsedSizes = [];
    if (selectedSizes) {
      try {
        parsedSizes = JSON.parse(selectedSizes);
      } catch (e) {
        // If parsing fails, treat as string
        parsedSizes = selectedSizes;
      }
    }

    // Send email
    const emailSent = await sendContactEmail({
      name,
      email,
      phone,
      message,
      reason,
      productName,
      selectedSizes: parsedSizes,
    });

    if (emailSent) {
      req.session.success = 'Thank you for your message! We will get back to you soon.';
    } else {
      req.session.success = 'Your message has been received. We will get back to you soon.';
    }

    // Redirect back to where form came from
    if (from === 'product' && productId) {
      return res.redirect(`/products/${productId}`);
    }
    res.redirect(from === 'home' ? '/' : '/contact');
  } catch (error) {
    console.error('Contact form error:', error);
    req.session.error = 'Error submitting form. Please try again.';
    const { from, productId } = req.body;
    if (from === 'product' && productId) {
      return res.redirect(`/products/${productId}`);
    }
    res.redirect(from === 'home' ? '/' : '/contact');
  }
};

exports.index = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;
    const statusFilter = req.query.status || '';

    const query = {};
    if (statusFilter) {
      query.status = statusFilter;
    }

    const contacts = await Contact.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Contact.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    res.render('admin/contacts/index', {
      contacts,
      currentPage: page,
      totalPages,
      statusFilter,
    });
  } catch (error) {
    req.session.error = 'Error loading contacts';
    res.redirect('/admin');
  }
};

exports.show = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    if (!contact) {
      req.session.error = 'Contact not found';
      return res.redirect('/admin/contacts');
    }
    res.render('admin/contacts/show', { contact });
  } catch (error) {
    req.session.error = 'Error loading contact';
    res.redirect('/admin/contacts');
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    await Contact.findByIdAndUpdate(req.params.id, { status });
    req.session.success = 'Contact status updated';
    res.redirect(`/admin/contacts/${req.params.id}`);
  } catch (error) {
    req.session.error = 'Error updating status';
    res.redirect('/admin/contacts');
  }
};

exports.delete = async (req, res) => {
  try {
    await Contact.findByIdAndDelete(req.params.id);
    req.session.success = 'Contact deleted successfully';
    res.redirect('/admin/contacts');
  } catch (error) {
    req.session.error = 'Error deleting contact';
    res.redirect('/admin/contacts');
  }
};

