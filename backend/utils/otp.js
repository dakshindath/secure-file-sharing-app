const nodemailer = require('nodemailer');

module.exports = async (email, otp) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail', 
    auth: {
      user: 'your-gmail',
<<<<<<< HEAD
      pass: 'your-password', 
    },
    tls: {
      rejectUnauthorized: false, // Allow self-signed certificates if needed
    },
=======
      pass: 'password'
    }
>>>>>>> 69613b26c28441ef3fcde729de8e5d5b87f48aa9
  });

  const mailOptions = {
    from: 'your-gmail',
    to: email,
    subject: 'Verification Code',
    text: `Your verification code is: ${otp}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; font-size: 16px;">
        <p>Your verification code is: <b>${otp}</b></p>
        <p>If you did not request this code, please ignore this email.</p>
      </div>
    `,

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
