package com.ayches.hotelerp.notification;

import com.ayches.hotelerp.booking.domain.Booking;

public interface EmailService {

    void sendBookingReceived(Booking booking);

    void sendBookingConfirmed(Booking booking);

    void sendBookingCancelled(Booking booking);
}
