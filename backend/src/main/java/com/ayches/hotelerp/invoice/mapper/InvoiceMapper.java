package com.ayches.hotelerp.invoice.mapper;

import com.ayches.hotelerp.invoice.domain.Invoice;
import com.ayches.hotelerp.invoice.dto.InvoiceDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper
public interface InvoiceMapper {

    @Mapping(target = "bookingId", source = "booking.id")
    @Mapping(target = "bookingCode", source = "booking.code")
    @Mapping(target = "clientId", source = "client.id")
    @Mapping(target = "clientFullName",
             expression = "java(invoice.getClient().getFirstName() + \" \" + invoice.getClient().getLastName())")
    @Mapping(target = "hotelName", source = "booking.room.hotel.name")
    InvoiceDto toDto(Invoice invoice);
}
