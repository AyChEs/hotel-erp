package com.ayches.hotelerp.dashboard;

import com.ayches.hotelerp.dashboard.DashboardDtos.OccupancySeries;
import com.ayches.hotelerp.dashboard.DashboardDtos.RevenueSeries;
import com.ayches.hotelerp.dashboard.DashboardDtos.Summary;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

/** ADMIN/MANAGER only — enforced by the /api/dashboard/** rule in SecurityConfig. */
@Tag(name = "Dashboard")
@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final StatsService stats;

    @Operation(summary = "KPI snapshot: occupancy today, bookings and revenue this month, pending tasks")
    @GetMapping("/summary")
    public Summary summary() {
        return stats.summary();
    }

    @Operation(summary = "Monthly invoiced revenue for the last N months (zero-filled)")
    @GetMapping("/revenue")
    public RevenueSeries revenue(@RequestParam(defaultValue = "12") int months) {
        return stats.revenue(months);
    }

    @Operation(summary = "Daily occupancy rate between two dates (max 120 days)")
    @GetMapping("/occupancy")
    public OccupancySeries occupancy(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return stats.occupancy(from, to);
    }
}
