package com.journal.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:noreply@trading-journal.com}")
    private String fromEmail;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendPasswordResetEmail(String toEmail, String token) {
        String resetLink = frontendUrl + "/reset-password?token=" + token;

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(toEmail);
        message.setSubject("Password Reset Request - Trading Journal");
        message.setText(buildPasswordResetEmailText(resetLink));

        mailSender.send(message);
    }

    private String buildPasswordResetEmailText(String resetLink) {
        return """
                Hello,

                You have requested to reset your password for your Trading Journal account.

                Click the link below to reset your password:
                %s

                This link will expire in 1 hour.

                If you did not request this password reset, please ignore this email.

                Best regards,
                Trading Journal Team
                """.formatted(resetLink);
    }
}
