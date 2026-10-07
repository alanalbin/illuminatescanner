package com.illuminate.qr.service;

import com.illuminate.qr.dto.CheckinRequest;
import com.illuminate.qr.dto.CheckinResponse;
import com.illuminate.qr.entity.Checkin;
import com.illuminate.qr.entity.Ticket;
import com.illuminate.qr.entity.TicketStatus;
import com.illuminate.qr.repository.CheckinRepository;
import com.illuminate.qr.repository.TicketRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class CheckinService {

    private final TicketRepository ticketRepository;
    private final CheckinRepository checkinRepository;

    public CheckinService(TicketRepository ticketRepository, CheckinRepository checkinRepository) {
        this.ticketRepository = ticketRepository;
        this.checkinRepository = checkinRepository;
    }

    /**
     * Extracts ticket ID from raw scanned QR data (handles plain ID or verification URLs)
     */
    public String extractTicketId(String raw) {
        if (raw == null || raw.trim().isEmpty()) {
            return "";
        }
        String clean = raw.trim();

        // Pattern for ILM-... ticket format
        Pattern ilmPattern = Pattern.compile("(ILM-[A-Za-z0-9_-]+)");
        Matcher matcher = ilmPattern.matcher(clean);
        if (matcher.find()) {
            return matcher.group(1);
        }

        // If it's a URL ending with the ticket ID
        if (clean.contains("/verify/")) {
            return clean.substring(clean.lastIndexOf("/verify/") + 8).split("[?#]")[0];
        }

        return clean;
    }

    /**
     * Validates a ticket without marking it as checked-in (view / inspect mode)
     */
    @Transactional(readOnly = true)
    public CheckinResponse validateTicket(String qrContent) {
        String ticketId = extractTicketId(qrContent);
        if (ticketId.isEmpty()) {
            return CheckinResponse.invalid("Empty QR content provided.");
        }

        Optional<Ticket> opt = ticketRepository.findByTicketId(ticketId);
        if (opt.isEmpty()) {
            return CheckinResponse.invalid("This QR code is not registered.");
        }

        Ticket ticket = opt.get();

        if (ticket.getStatus() == TicketStatus.CANCELLED) {
            return CheckinResponse.cancelled(ticket.getTicketId(), ticket.getParticipantName());
        }

        if (ticket.isCheckedIn() || ticket.getStatus() == TicketStatus.USED) {
            return CheckinResponse.alreadyUsed(
                    ticket.getTicketId(),
                    ticket.getParticipantName(),
                    ticket.getCheckedInAt(),
                    ticket.getCheckedInBy()
            );
        }

        return CheckinResponse.valid(
                ticket.getTicketId(),
                ticket.getParticipantName(),
                null,
                null
        );
    }

    /**
     * Validates and marks ticket check-in atomically with audit log.
     * Prevents race conditions when multiple scanners scan the exact same pass at once.
     */
    @Transactional
    public CheckinResponse processCheckin(CheckinRequest request) {
        String ticketId = extractTicketId(request.getQrContent());
        String scanner = (request.getScannedBy() != null && !request.getScannedBy().isBlank())
                ? request.getScannedBy() : "Volunteer/Scanner";
        String device = request.getDeviceInfo() != null ? request.getDeviceInfo() : "Mobile Scanner";

        if (ticketId.isEmpty()) {
            recordCheckinLog("UNKNOWN", null, scanner, "INVALID", device);
            return CheckinResponse.invalid("Invalid QR code format.");
        }

        Optional<Ticket> opt = ticketRepository.findByTicketId(ticketId);
        if (opt.isEmpty()) {
            recordCheckinLog(ticketId, null, scanner, "INVALID", device);
            return CheckinResponse.invalid("This QR code is not registered.");
        }

        Ticket ticket = opt.get();

        // Check if ticket is cancelled
        if (ticket.getStatus() == TicketStatus.CANCELLED) {
            recordCheckinLog(ticket.getTicketId(), ticket.getParticipantName(), scanner, "CANCELLED", device);
            return CheckinResponse.cancelled(ticket.getTicketId(), ticket.getParticipantName());
        }

        // Check if already checked in
        if (ticket.isCheckedIn() || ticket.getStatus() == TicketStatus.USED) {
            recordCheckinLog(ticket.getTicketId(), ticket.getParticipantName(), scanner, "ALREADY_USED", device);
            return CheckinResponse.alreadyUsed(
                    ticket.getTicketId(),
                    ticket.getParticipantName(),
                    ticket.getCheckedInAt(),
                    ticket.getCheckedInBy()
            );
        }

        // ATOMIC DB UPDATE: eliminates race conditions across simultaneous scans
        LocalDateTime now = LocalDateTime.now();
        int updatedRows = ticketRepository.markCheckedInAtomically(ticketId, now, scanner);

        if (updatedRows > 0) {
            recordCheckinLog(ticket.getTicketId(), ticket.getParticipantName(), scanner, "VALID", device);
            return CheckinResponse.valid(ticket.getTicketId(), ticket.getParticipantName(), now, scanner);
        } else {
            // Another scanner just marked it a millisecond earlier!
            Ticket refreshed = ticketRepository.findByTicketId(ticketId).orElse(ticket);
            recordCheckinLog(ticket.getTicketId(), ticket.getParticipantName(), scanner, "ALREADY_USED", device);
            return CheckinResponse.alreadyUsed(
                    refreshed.getTicketId(),
                    refreshed.getParticipantName(),
                    refreshed.getCheckedInAt(),
                    refreshed.getCheckedInBy()
            );
        }
    }

    private void recordCheckinLog(String ticketId, String participantName, String scanner, String result, String deviceInfo) {
        Checkin checkin = new Checkin(ticketId, participantName, scanner, result, deviceInfo);
        checkinRepository.save(checkin);
    }
}
