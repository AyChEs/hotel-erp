package com.ayches.hotelerp.dashboard;

import com.ayches.hotelerp.common.exception.BusinessRuleException;
import com.ayches.hotelerp.dashboard.DashboardDtos.OccupancyPoint;
import com.ayches.hotelerp.dashboard.DashboardDtos.OccupancySeries;
import com.ayches.hotelerp.dashboard.DashboardDtos.RevenuePoint;
import com.ayches.hotelerp.dashboard.DashboardDtos.RevenueSeries;
import com.ayches.hotelerp.dashboard.DashboardDtos.Summary;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.sql.Date;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StatsService {

    private static final DateTimeFormatter MONTH = DateTimeFormatter.ofPattern("yyyy-MM");

    @PersistenceContext
    private final EntityManager em;

    public Summary summary() {
        long totalHotels = count("select count(*) from hotel where active = true");
        long totalRooms = count("select count(*) from room where status <> 'OUT_OF_SERVICE'");
        long occupiedToday = count("""
                select count(distinct b.room_id) from booking b
                where b.status in ('CONFIRMED', 'CHECKED_IN')
                  and b.check_in_date <= current_date and b.check_out_date > current_date""");
        long bookingsThisMonth = count("""
                select count(*) from booking
                where created_at >= date_trunc('month', current_date)""");
        BigDecimal revenueThisMonth = (BigDecimal) em.createNativeQuery("""
                        select coalesce(sum(total), 0) from invoice
                        where status <> 'CANCELLED'
                          and issued_at >= date_trunc('month', current_date)""")
                .getSingleResult();
        long pendingTasks = count(
                "select count(*) from task where status in ('PENDING', 'IN_PROGRESS')");

        Map<String, Long> byStatus = new LinkedHashMap<>();
        for (Object[] row : rows("select status, count(*) from booking group by status order by status")) {
            byStatus.put((String) row[0], ((Number) row[1]).longValue());
        }

        return new Summary(totalHotels, totalRooms, occupiedToday,
                rate(occupiedToday, totalRooms), bookingsThisMonth,
                revenueThisMonth, pendingTasks, byStatus);
    }

    /** Revenue by invoice month for the last N months, zero-filled. */
    public RevenueSeries revenue(int months) {
        if (months < 1 || months > 36) {
            throw new BusinessRuleException("months must be between 1 and 36");
        }
        Map<String, BigDecimal> byMonth = new LinkedHashMap<>();
        YearMonth current = YearMonth.now();
        for (int i = months - 1; i >= 0; i--) {
            byMonth.put(current.minusMonths(i).format(MONTH), BigDecimal.ZERO);
        }
        List<Object[]> data = rows("""
                select to_char(date_trunc('month', issued_at), 'YYYY-MM'), sum(total)
                from invoice
                where status <> 'CANCELLED'
                  and issued_at >= date_trunc('month', current_date) - interval '%d months'
                group by 1 order by 1""".formatted(months - 1));
        for (Object[] row : data) {
            byMonth.computeIfPresent((String) row[0], (k, v) -> (BigDecimal) row[1]);
        }
        return new RevenueSeries(byMonth.entrySet().stream()
                .map(e -> new RevenuePoint(e.getKey(), e.getValue())).toList());
    }

    /** Daily occupancy in [from, to] — % of serviceable rooms with an active booking that night. */
    public OccupancySeries occupancy(LocalDate from, LocalDate to) {
        if (from.isAfter(to)) {
            throw new BusinessRuleException("'from' must not be after 'to'");
        }
        if (from.plusDays(120).isBefore(to)) {
            throw new BusinessRuleException("Range too large (max 120 days)");
        }
        long totalRooms = count("select count(*) from room where status <> 'OUT_OF_SERVICE'");
        List<Object[]> data = em.createNativeQuery("""
                        select d::date, count(b.id)
                        from generate_series(cast(:fromDate as date), cast(:toDate as date),
                                             interval '1 day') d
                        left join booking b
                          on b.status in ('CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT')
                         and b.check_in_date <= d::date
                         and b.check_out_date > d::date
                        group by d::date
                        order by d::date""")
                .setParameter("fromDate", Date.valueOf(from))
                .setParameter("toDate", Date.valueOf(to))
                .getResultList();

        List<OccupancyPoint> points = new ArrayList<>(data.size());
        for (Object[] row : data) {
            LocalDate day = ((Date) row[0]).toLocalDate();
            long occupied = ((Number) row[1]).longValue();
            points.add(new OccupancyPoint(day, occupied, totalRooms, rate(occupied, totalRooms)));
        }
        return new OccupancySeries(points);
    }

    private long count(String sql) {
        return ((Number) em.createNativeQuery(sql).getSingleResult()).longValue();
    }

    @SuppressWarnings("unchecked")
    private List<Object[]> rows(String sql) {
        return em.createNativeQuery(sql).getResultList();
    }

    private static double rate(long part, long whole) {
        return whole == 0 ? 0.0 : Math.round(part * 1000.0 / whole) / 10.0;
    }
}
