const nodemailer = require('nodemailer')

// Check if email credentials are configured
// Support both EMAIL_* and SMTP_* variable names for compatibility
const isEmailConfigured = () => {
  return !!(
    (process.env.EMAIL_USER || process.env.SMTP_USER) &&
    (process.env.EMAIL_PASS || process.env.SMTP_PASS)
  )
}

// Get email configuration with fallback to both naming conventions
const getEmailConfig = () => {
  return {
    host: process.env.EMAIL_HOST || process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || process.env.SMTP_PORT || '587'),
    user: process.env.EMAIL_USER || process.env.SMTP_USER,
    pass: process.env.EMAIL_PASS || process.env.SMTP_PASS,
    from:
      process.env.FROM_EMAIL || process.env.EMAIL_USER || process.env.SMTP_USER,
    to:
      process.env.EMAIL_TO ||
      process.env.CONTACT_RECEIVER ||
      'aquarianpoolandspa@gmail.com',
    cc: process.env.EMAIL_CC
  }
}

// Only create transporter if credentials are available
let transporter = null
if (isEmailConfigured()) {
  const config = getEmailConfig()
  transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: false,
    auth: {
      user: config.user,
      pass: config.pass
    }
  })
  console.log('✅ Email transporter configured')
} else {
  console.warn(
    '⚠️  Email not configured: EMAIL_USER/SMTP_USER and/or EMAIL_PASS/SMTP_PASS environment variables are not set'
  )
  console.warn(
    '⚠️  Contact form submissions will be saved to database but emails will not be sent'
  )
}

const sendContactEmail = async contactData => {
  // Check if email is configured
  if (!isEmailConfigured()) {
    console.error(
      '❌ Cannot send email: EMAIL_USER/SMTP_USER and/or EMAIL_PASS/SMTP_PASS not configured'
    )
    return false
  }

  if (!transporter) {
    console.error('❌ Email transporter not initialized')
    return false
  }

  const config = getEmailConfig()

  let sizesHtml = ''
  if (contactData.selectedSizes && contactData.selectedSizes.length > 0) {
    sizesHtml = '<p><strong>Selected Sizes:</strong></p><ul>'
    if (Array.isArray(contactData.selectedSizes)) {
      contactData.selectedSizes.forEach(size => {
        const priceText = size.price
          ? ` - $${parseFloat(size.price).toFixed(2)}`
          : ''
        const descText = size.description ? ` (${size.description})` : ''
        sizesHtml += `<li><strong>${size.name}</strong>${priceText}${descText}</li>`
      })
    }
    sizesHtml += '</ul>'
  }

  const mailOptions = {
    from: config.from,
    to: config.to,
    ...(config.cc && { cc: config.cc }),
    subject: contactData.productName
      ? `Product Inquiry: ${contactData.productName} from ${contactData.name}`
      : `New Contact Form Submission from ${contactData.name}`,
    html: `
      <h2>New Contact Form Submission</h2>
      <p><strong>Name:</strong> ${contactData.name}</p>
      <p><strong>Email:</strong> ${contactData.email}</p>
      <p><strong>Phone:</strong> ${contactData.phone || 'Not provided'}</p>
      ${
        contactData.town
          ? `<p><strong>Town:</strong> ${contactData.town}</p>`
          : ''
      }
      ${
        contactData.reason
          ? `<p><strong>Reason for Contact:</strong> ${contactData.reason}</p>`
          : ''
      }
      ${
        contactData.productName
          ? `<p><strong>Product:</strong> ${contactData.productName}</p>`
          : ''
      }
      ${sizesHtml}
      <p><strong>Message:</strong></p>
      <p>${contactData.message.replace(/\n/g, '<br>')}</p>
    `
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    console.log('✅ Email sent successfully:', info.messageId)
    return true
  } catch (error) {
    console.error('❌ Email sending error:')
    console.error('   Error code:', error.code)
    console.error('   Error message:', error.message)
    if (error.response) {
      console.error('   SMTP response:', error.response)
    }
    return false
  }
}

module.exports = { sendContactEmail }
