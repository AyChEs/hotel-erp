package com.ayches.hotelerp.booking.mapper;

import com.ayches.hotelerp.booking.domain.Booking;
import com.ayches.hotelerp.booking.dto.BookingDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper
public interface BookingMapper {

    @Mapping(target = "roomId", source = "room.id")
    @Mapping(target = "roomNumber", source = "room.number")
    @Mapping(target = "hotelId", source = "room.hotel.id")
    @Mapping(target = "hotelName", source = "room.hotel.name")
    @Mapping(target = "clientId", source = "client.id")
    @Mapping(target = "clientFullName",
             expression = "java(booking.getClient().getFirstName() + \" \" + booking.getClient().getLastName())")
    @Mapping(target = "invoiceId", ignore = true)
    BookingDto toDto(Booking booking);
}
