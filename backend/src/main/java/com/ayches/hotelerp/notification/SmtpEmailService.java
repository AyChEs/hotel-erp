package com.ayches.hotelerp.notification;

import com.ayches.hotelerp.booking.domain.Booking;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;

/**
 * Sends booking lifecycle emails through whatever SMTP relay is configured
 * (Mailpit locally, Brevo in production). Async and best-effort: a mail
 * failure must never roll back the booking that triggered it.
 */
@Slf4j
@Service
@ConditionalOnBean(JavaMailSender.class)
public class SmtpEmailService implements EmailService {

    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final JavaMailSender mailSender;
    private final String from;

    public SmtpEmailService(JavaMailSender mailSender,
                            @Value("${app.mail.from}") String from) {
        this.mailSender = mailSender;
        this.from = from;
    }

    @Async
    @Override
    public void sendBookingReceived(Booking booking) {
        send(booking, "We received your booking " + booking.getCode(),
                """
                Thank you for your booking!

                %s
                Status: pending confirmation. We will email you as soon as our team confirms it.""");
    }

    @Async
    @Override
    public void sendBookingConfirmed(Booking booking) {
        send(booking, "Booking " + booking.getCode() + " confirmed",
                """
                Great news — your booking is confirmed!

                %s
                We look forward to welcoming you.""");
    }

    @Async
    @Override
    public void sendBookingCancelled(Booking booking) {
        send(booking, "Booking " + booking.getCode() + " cancelled",
                """
                Your booking has been cancelled.

                %s
                If this was a mistake, you can book again at any time.""");
    }

    private void send(Booking booking, String subject, String bodyTemplate) {
        String email = booking.getClient().getUser() != null
                ? booking.getClient().getUser().getEmail() : null;
        if (email == null) {
            return; // walk-in client without an account
        }
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(from);
            message.setTo(email);
            message.setSubject("[Hotel ERP] " + subject);
            message.setText(bodyTemplate.formatted(summary(booking)));
            mailSender.send(message);
        } catch (Exception e) {
            log.error("Failed to send '{}' email for booking {}: {}",
                    subject, booking.getCode(), e.getMessage());
        }
    }

    private String summary(Booking booking) {
        return """
                Booking:   %s
                Hotel:     %s
                Room:      %s (%s)
                Check-in:  %s
                Check-out: %s
                Guests:    %d
                Board:     %s
                Total:     %.2f EUR""".formatted(
                booking.getCode(),
                booking.getRoom().getHotel().getName(),
                booking.getRoom().getNumber(), booking.getRoom().getType(),
                DATE.format(booking.getCheckInDate()),
                DATE.format(booking.getCheckOutDate()),
                booking.getGuests(),
                booking.getBoardType(),
                booking.getTotalPrice());
    }
}
