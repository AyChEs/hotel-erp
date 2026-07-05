package com.ayches.hotelerp.dashboard;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public final class DashboardDtos {

    private DashboardDtos() {
    }

    public record Summary(
            long totalHotels,
            long totalRooms,
            long occupiedRoomsToday,
            double occupancyRateToday,
            long bookingsThisMonth,
            BigDecimal revenueThisMonth,
            long pendingTasks,
            Map<String, Long> bookingsByStatus) {
    }

    public record RevenuePoint(String month, BigDecimal revenue) {
    }

    public record OccupancyPoint(LocalDate date, long occupiedRooms, long totalRooms, double rate) {
    }

    public record RevenueSeries(List<RevenuePoint> points) {
    }

    public record OccupancySeries(List<OccupancyPoint> points) {
    }
}
