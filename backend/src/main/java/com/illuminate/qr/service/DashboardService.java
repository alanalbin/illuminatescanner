package com.illuminate.qr.service;

import com.illuminate.qr.dto.StatsResponse;
import com.illuminate.qr.entity.Checkin;
import com.illuminate.qr.entity.TicketStatus;
import com.illuminate.qr.repository.CheckinRepository;
import com.illuminate.qr.repository.TicketRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class DashboardService {

    private final TicketRepository ticketRepository;
    private final CheckinRepository checkinRepository;

    public DashboardService(TicketRepository ticketRepository, CheckinRepository checkinRepository) {
        this.ticketRepository = ticketRepository;
        this.checkinRepository = checkinRepository;
    }

    @Transactional(readOnly = true)
    public StatsResponse getDashboardStats() {
        long totalRegistrations = ticketRepository.count();
        long qrGenerated = totalRegistrations;
        long checkedIn = ticketRepository.countByCheckedIn(true);
        long cancelled = ticketRepository.countByStatus(TicketStatus.CANCELLED);
        long remaining = Math.max(0, totalRegistrations - checkedIn - cancelled);
        long invalidAttempts = checkinRepository.countByResult("INVALID");

        List<Checkin> recentCheckins = checkinRepository.findTop50ByOrderByScannedAtDesc();

        return new StatsResponse(
                totalRegistrations,
                qrGenerated,
                checkedIn,
                remaining,
                invalidAttempts,
                cancelled,
                recentCheckins
        );
    }
}
