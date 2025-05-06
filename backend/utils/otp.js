const nodemailer = require('nodemailer');

module.exports = async (email, otp) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail', 
    auth: {
      user: 'retom7887@gmail.com',
      pass: 'ghen oght wgqw aubc'
    }
  });

  const mailOptions = {
    from: 'retom7887@gmail.com',
    to: email,
    subject: 'Verification Code',
    text: `Your verification code is: ${otp}`,
    html: `
      <div>
        <p>Your verification code is: <b>${otp}</b></p>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};