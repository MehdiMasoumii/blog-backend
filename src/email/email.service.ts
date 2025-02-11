import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import * as SMTPTransport from 'nodemailer/lib/smtp-transport';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter<SMTPTransport.SentMessageInfo>;
  private oauth2Client: OAuth2Client;

  private async initializeTransporter() {
    try {
      const accessToken =
        (await this.oauth2Client.getAccessToken())?.token || '';

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      this.transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        // secure: true, //in production, uncomment this line!
        auth: {
          type: 'OAuth2',
          user: process.env.EMAIL_USER,
          clientId: process.env.CLIENT_ID,
          clientSecret: process.env.CLIENT_SECRET,
          refreshToken: process.env.REFRESH_TOKEN,
          accessToken: accessToken,
        },
      });
    } catch (error) {
      console.error('Failed to create Nodemailer transporter:', error);
      throw new Error('Transporter initialization failed');
    }
  }
  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.CLIENT_ID,
      process.env.CLIENT_SECRET,
      'https://developers.google.com/oauthplayground', // Must match redirect URI in Google Console
    );

    this.oauth2Client.setCredentials({
      refresh_token: process.env.REFRESH_TOKEN,
    });
    this.initializeTransporter();
  }

  async sendVerificationEmail(
    toEmail: string,
    token: string,
    method: 'reset' | 'verify',
  ): Promise<void> {
    const verificationLink = `http://localhost:3000/auth/${method}?email=${toEmail}&token=${token}`;

    const mailOptions = {
      from: `"Blog app" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject:
        method === 'verify' ? 'Verify Your Email' : 'Reset Your password',
      text: `Click the link to ${method === 'verify' ? 'Verify Your Email' : 'Reset Your password'}: ${verificationLink}`,
      html: `<p>Click the link to ${method === 'verify' ? 'Verify Your Email' : 'Reset Your password'}: <a href="${verificationLink}">${verificationLink}</a></p>`,
    };
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      await this.transporter.sendMail(mailOptions);
      // console.log('Verification email sent!');
    } catch (error) {
      console.error('Error sending email:', error);
      throw new InternalServerErrorException();
    }
  }
}
