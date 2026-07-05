package com.ayches.hotelerp.booking.service;

import com.ayches.hotelerp.booking.domain.BoardType;
import com.ayches.hotelerp.booking.domain.Booking;
import com.ayches.hotelerp.booking.domain.BookingStatus;
import com.ayches.hotelerp.booking.dto.BookingCreateRequest;
import com.ayches.hotelerp.booking.dto.BookingDto;
import com.ayches.hotelerp.booking.dto.MyBookingRequest;
import com.ayches.hotelerp.booking.mapper.BookingMapper;
import com.ayches.hotelerp.booking.repository.BookingRepository;
import com.ayches.hotelerp.common.exception.BusinessRuleException;
import com.ayches.hotelerp.common.exception.ConflictException;
import com.ayches.hotelerp.common.exception.NotFoundException;
import com.ayches.hotelerp.common.web.PageResponse;
import com.ayches.hotelerp.invoice.repository.InvoiceRepository;
import com.ayches.hotelerp.notification.EmailService;
import com.ayches.hotelerp.person.domain.Client;
import com.ayches.hotelerp.person.repository.ClientRepository;
import com.ayches.hotelerp.room.domain.Room;
import com.ayches.hotelerp.room.domain.RoomStatus;
import com.ayches.hotelerp.room.repository.RoomRepository;
import com.ayches.hotelerp.task.domain.Task;
import com.ayches.hotelerp.task.domain.TaskPriority;
import com.ayches.hotelerp.task.domain.TaskType;
import com.ayches.hotelerp.task.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Year;
import java.util.Set;
import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BookingService {

    private final BookingRepository bookings;
    private final RoomRepository rooms;
    private final ClientRepository clients;
    private final InvoiceRepository invoices;
    private final TaskRepository tasks;
    private final BookingMapper mapper;
    private final EmailService emailService;

    // ---------- queries ----------

    public PageResponse<BookingDto> search(BookingStatus status, Long hotelId, Long clientId,
                                           LocalDate from, LocalDate to, Pageable pageable) {
        Specification<Booking> spec = Specification.where(null);
        if (status != null) {
            spec = spec.and((root, q, cb) -> cb.equal(root.get("status"), status));
        }
        if (hotelId != null) {
            spec = spec.and((root, q, cb) ->
                    cb.equal(root.get("room").get("hotel").get("id"), hotelId));
        }
        if (clientId != null) {
            spec = spec.and((root, q, cb) -> cb.equal(root.get("client").get("id"), clientId));
        }
        if (from != null) {
            spec = spec.and((root, q, cb) ->
                    cb.greaterThanOrEqualTo(root.get("checkOutDate"), from));
        }
        if (to != null) {
            spec = spec.and((root, q, cb) -> cb.lessThan(root.get("checkInDate"), to));
        }
        return PageResponse.of(bookings.findAll(spec, pageable), this::toDtoWithInvoice);
    }

    public BookingDto findById(Long id) {
        return toDtoWithInvoice(getOrThrow(id));
    }

    public PageResponse<BookingDto> findMine(String email, Pageable pageable) {
        return PageResponse.of(bookings.findByClientUserEmail(email, pageable),
                this::toDtoWithInvoice);
    }

    // ---------- creation ----------

    @Transactional
    public BookingDto create(BookingCreateRequest request) {
        Client client = clients.findById(request.clientId())
                .orElseThrow(() -> new NotFoundException("Client", request.clientId()));
        return place(client, request.roomId(), request.checkInDate(), request.checkOutDate(),
                request.guests(), request.boardType(), request.notes());
    }

    @Transactional
    public BookingDto createForUser(String email, MyBookingRequest request) {
        Client client = clients.findByUserEmail(email)
                .orElseThrow(() -> new NotFoundException("No client profile for " + email));
        return place(client, request.roomId(), request.checkInDate(), request.checkOutDate(),
                request.guests(), request.boardType(), request.notes());
    }

    private BookingDto place(Client client, Long roomId, LocalDate checkIn, LocalDate checkOut,
                             short guests, BoardType boardType, String notes) {
        if (!checkOut.isAfter(checkIn)) {
            throw new BusinessRuleException("Check-out must be after check-in");
        }
        Room room = rooms.findById(roomId)
                .orElseThrow(() -> new NotFoundException("Room", roomId));
        if (room.getStatus() == RoomStatus.OUT_OF_SERVICE) {
            throw new BusinessRuleException("Room is out of service");
        }
        if (guests > room.getCapacity()) {
            throw new BusinessRuleException(
                    "Room capacity is %d guests".formatted(room.getCapacity()));
        }
        // Service-level check; the Postgres EXCLUDE constraint is the race-proof backstop.
        if (bookings.existsOverlapping(roomId, checkIn, checkOut)) {
            throw new ConflictException("Room is not available for the selected dates");
        }

        Booking booking = new Booking();
        booking.setCode(nextCode());
        booking.setClient(client);
        booking.setRoom(room);
        booking.setCheckInDate(checkIn);
        booking.setCheckOutDate(checkOut);
        booking.setGuests(guests);
        booking.setBoardType(boardType);
        booking.setNotes(notes);
        booking.setTotalPrice(price(room, checkIn, checkOut, guests, boardType));

        Booking saved = bookings.save(booking);
        emailService.sendBookingReceived(saved);
        return toDtoWithInvoice(saved);
    }

    /**
     * pricePerNight covers the room itself (breakfast included for BED_AND_BREAKFAST);
     * half/full board add a per-guest, per-night supplement.
     */
    static BigDecimal price(Room room, LocalDate checkIn, LocalDate checkOut,
                            short guests, BoardType boardType) {
        long nights = java.time.temporal.ChronoUnit.DAYS.between(checkIn, checkOut);
        BigDecimal supplement = switch (boardType) {
            case ROOM_ONLY, BED_AND_BREAKFAST -> BigDecimal.ZERO;
            case HALF_BOARD -> room.getHalfBoardSupplement();
            case FULL_BOARD -> room.getFullBoardSupplement();
        };
        return room.getPricePerNight()
                .add(supplement.multiply(BigDecimal.valueOf(guests)))
                .multiply(BigDecimal.valueOf(nights))
                .setScale(2, java.math.RoundingMode.HALF_UP);
    }

    // ---------- lifecycle ----------

    private static final Set<BookingStatus> CANCELLABLE =
            Set.of(BookingStatus.PENDING, BookingStatus.CONFIRMED);

    @Transactional
    public BookingDto confirm(Long id) {
        Booking booking = transition(id, BookingStatus.PENDING, BookingStatus.CONFIRMED);
        emailService.sendBookingConfirmed(booking);
        return toDtoWithInvoice(booking);
    }

    @Transactional
    public BookingDto checkIn(Long id) {
        Booking booking = transition(id, BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN);
        booking.getRoom().setStatus(RoomStatus.OCCUPIED);
        return toDtoWithInvoice(booking);
    }

    @Transactional
    public BookingDto checkOut(Long id) {
        Booking booking = transition(id, BookingStatus.CHECKED_IN, BookingStatus.CHECKED_OUT);
        Room room = booking.getRoom();
        room.setStatus(RoomStatus.CLEANING);
        tasks.save(turnoverCleaningTask(booking));
        return toDtoWithInvoice(booking);
    }

    @Transactional
    public BookingDto cancel(Long id) {
        Booking booking = getOrThrow(id);
        requireStatus(booking, CANCELLABLE, BookingStatus.CANCELLED);
        booking.setStatus(BookingStatus.CANCELLED);
        emailService.sendBookingCancelled(booking);
        return toDtoWithInvoice(booking);
    }

    /** Clients may only cancel their own pending/confirmed bookings. */
    @Transactional
    public BookingDto cancelOwn(String email, Long id) {
        Booking booking = getOrThrow(id);
        boolean owned = booking.getClient().getUser() != null
                && booking.getClient().getUser().getEmail().equals(email);
        if (!owned) {
            throw new NotFoundException("Booking", id); // don't reveal other clients' bookings
        }
        requireStatus(booking, CANCELLABLE, BookingStatus.CANCELLED);
        booking.setStatus(BookingStatus.CANCELLED);
        emailService.sendBookingCancelled(booking);
        return toDtoWithInvoice(booking);
    }

    private Booking transition(Long id, BookingStatus expected, BookingStatus next) {
        Booking booking = getOrThrow(id);
        requireStatus(booking, Set.of(expected), next);
        booking.setStatus(next);
        return booking;
    }

    private void requireStatus(Booking booking, Set<BookingStatus> allowed, BookingStatus target) {
        if (!allowed.contains(booking.getStatus())) {
            throw new BusinessRuleException("Cannot move booking %s from %s to %s"
                    .formatted(booking.getCode(), booking.getStatus(), target));
        }
    }

    private Task turnoverCleaningTask(Booking booking) {
        Task task = new Task();
        task.setTitle("Turnover cleaning — room " + booking.getRoom().getNumber());
        task.setDescription("Automatic task created on check-out of booking " + booking.getCode());
        task.setType(TaskType.CLEANING);
        task.setPriority(TaskPriority.HIGH);
        task.setDueDate(LocalDate.now());
        task.setRoom(booking.getRoom());
        task.setHotel(booking.getRoom().getHotel());
        return task;
    }

    // ---------- helpers ----------

    private BookingDto toDtoWithInvoice(Booking booking) {
        BookingDto dto = mapper.toDto(booking);
        Long invoiceId = invoices.findByBookingId(booking.getId())
                .map(inv -> inv.getId()).orElse(null);
        return new BookingDto(dto.id(), dto.code(), dto.checkInDate(), dto.checkOutDate(),
                dto.guests(), dto.boardType(), dto.status(), dto.totalPrice(), dto.notes(),
                dto.createdAt(), dto.roomId(), dto.roomNumber(), dto.hotelId(), dto.hotelName(),
                dto.clientId(), dto.clientFullName(), invoiceId);
    }

    private String nextCode() {
        String code;
        do {
            code = "BK-%d-%06d".formatted(Year.now().getValue(),
                    ThreadLocalRandom.current().nextInt(1_000_000));
        } while (bookings.existsByCode(code));
        return code;
    }

    private Booking getOrThrow(Long id) {
        return bookings.findById(id).orElseThrow(() -> new NotFoundException("Booking", id));
    }
}
