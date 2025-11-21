const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendContactEmail = async (contactData) => {
  let sizesHtml = '';
  if (contactData.selectedSizes && contactData.selectedSizes.length > 0) {
    sizesHtml = '<p><strong>Selected Sizes:</strong></p><ul>';
    if (Array.isArray(contactData.selectedSizes)) {
      contactData.selectedSizes.forEach(size => {
        const priceText = size.price ? ` - $${parseFloat(size.price).toFixed(2)}` : '';
        const descText = size.description ? ` (${size.description})` : '';
        sizesHtml += `<li><strong>${size.name}</strong>${priceText}${descText}</li>`;
      });
    }
    sizesHtml += '</ul>';
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_TO || 'aquarianpoolandspa@gmail.com',
    subject: contactData.productName 
      ? `Product Inquiry: ${contactData.productName} from ${contactData.name}`
      : `New Contact Form Submission from ${contactData.name}`,
    html: `
      <h2>New Contact Form Submission</h2>
      <p><strong>Name:</strong> ${contactData.name}</p>
      <p><strong>Email:</strong> ${contactData.email}</p>
      <p><strong>Phone:</strong> ${contactData.phone || 'Not provided'}</p>
      ${contactData.productName ? `<p><strong>Product:</strong> ${contactData.productName}</p>` : ''}
      ${sizesHtml}
      ${contactData.reason ? `<p><strong>Reason:</strong> ${contactData.reason}</p>` : ''}
      <p><strong>Message:</strong></p>
      <p>${contactData.message.replace(/\n/g, '<br>')}</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    return false;
  }
};

module.exports = { sendContactEmail };

