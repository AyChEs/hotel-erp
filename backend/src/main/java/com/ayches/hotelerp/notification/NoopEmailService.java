package com.ayches.hotelerp.notification;

import com.ayches.hotelerp.booking.domain.Booking;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.javamail.JavaMailSender;

/**
 * Active whenever no SMTP sender is configured (tests, CI). Local dev uses the
 * Mailpit container from docker-compose through the real SMTP implementation.
 */
@Slf4j
@Configuration
public class NoopEmailService {

    @Bean
    @ConditionalOnMissingBean(JavaMailSender.class)
    public EmailService noopEmail() {
        return new EmailService() {
            @Override
            public void sendBookingReceived(Booking booking) {
                log.info("[noop-email] booking received: {}", booking.getCode());
            }

            @Override
            public void sendBookingConfirmed(Booking booking) {
                log.info("[noop-email] booking confirmed: {}", booking.getCode());
            }

            @Override
            public void sendBookingCancelled(Booking booking) {
                log.info("[noop-email] booking cancelled: {}", booking.getCode());
            }
        };
    }
}
