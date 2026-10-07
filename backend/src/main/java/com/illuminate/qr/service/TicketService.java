package com.illuminate.qr.service;

import com.illuminate.qr.dto.BulkImportResult;
import com.illuminate.qr.dto.TicketRequest;
import com.illuminate.qr.dto.TicketResponse;
import com.illuminate.qr.entity.Ticket;
import com.illuminate.qr.entity.TicketStatus;
import com.illuminate.qr.repository.TicketRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class TicketService {

    private final TicketRepository ticketRepository;

    @Value("${app.domain:http://localhost:5173}")
    private String appDomain;

    public TicketService(TicketRepository ticketRepository) {
        this.ticketRepository = ticketRepository;
    }

    @Transactional(readOnly = true)
    public List<TicketResponse> getTickets(String query, TicketStatus status) {
        List<Ticket> tickets = ticketRepository.searchTickets(query, status);
        return tickets.stream()
                .map(t -> TicketResponse.fromEntity(t, appDomain))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public TicketResponse getTicketByTicketId(String ticketId) {
        Ticket ticket = ticketRepository.findByTicketId(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found: " + ticketId));
        return TicketResponse.fromEntity(ticket, appDomain);
    }

    @Transactional
    public TicketResponse createTicket(TicketRequest request) {
        String ticketId = request.getTicketId().trim();
        if (ticketRepository.existsByTicketId(ticketId)) {
            throw new IllegalArgumentException("Ticket ID already exists: " + ticketId);
        }

        Ticket ticket = new Ticket(
                ticketId,
                request.getParticipantName().trim(),
                request.getEmail() != null ? request.getEmail().trim() : null,
                request.getPhone() != null ? request.getPhone().trim() : null
        );
        ticket.setQrToken(UUID.randomUUID().toString());

        Ticket saved = ticketRepository.save(ticket);
        return TicketResponse.fromEntity(saved, appDomain);
    }

    @Transactional
    public BulkImportResult importCsv(MultipartFile file) {
        BulkImportResult result = new BulkImportResult();
        if (file.isEmpty()) {
            result.getErrors().add("Uploaded file is empty");
            return result;
        }

        Set<String> seenInBatch = new HashSet<>();
        List<Ticket> toSave = new ArrayList<>();

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            int lineNumber = 0;
            int ticketIdCol = -1;
            int nameCol = -1;
            int emailCol = -1;
            int phoneCol = -1;
            boolean headersResolved = false;

            while ((line = reader.readLine()) != null) {
                lineNumber++;
                line = line.trim();
                if (line.isEmpty()) continue;

                String[] parts = parseCsvLine(line);
                if (parts.length == 0) continue;

                // Check if this row looks like single letter column labels e.g. "A,B,C,D..."
                boolean isLetterHeaders = true;
                for (String p : parts) {
                    if (p.length() > 2) {
                        isLetterHeaders = false;
                        break;
                    }
                }
                if (isLetterHeaders && parts.length > 5) {
                    continue; // Skip spreadsheet grid index row (A, B, C, D...)
                }

                // Check if this line is a header row
                boolean looksLikeHeader = false;
                for (String p : parts) {
                    String pLow = p.toLowerCase().trim();
                    if (pLow.contains("ticket") || pLow.contains("registration") || pLow.contains("participant") ||
                        pLow.contains("name") || pLow.contains("email") || pLow.contains("timestamp") || pLow.contains("phone")) {
                        looksLikeHeader = true;
                        break;
                    }
                }

                if (looksLikeHeader && !headersResolved) {
                    for (int i = 0; i < parts.length; i++) {
                        String h = parts[i].toLowerCase().trim();
                        if (h.contains("ticket") || h.contains("registration number") || h.contains("reg no") || h.contains("registration id")) {
                            if (ticketIdCol == -1) ticketIdCol = i;
                        } else if (h.contains("name") || h.contains("participant") || h.contains("student")) {
                            if (nameCol == -1) nameCol = i;
                        } else if (h.contains("email") || h.contains("mail")) {
                            if (emailCol == -1) emailCol = i;
                        } else if (h.contains("phone") || h.contains("mobile") || h.contains("contact")) {
                            if (phoneCol == -1) phoneCol = i;
                        }
                    }
                    if (ticketIdCol != -1 && nameCol != -1) {
                        headersResolved = true;
                        continue;
                    }
                }

                // If headers were never resolved, infer column indices
                if (!headersResolved) {
                    // Check if column 1 starts with ILM- (Google Sheet layout without header detection)
                    if (parts.length > 1 && parts[1].trim().startsWith("ILM-")) {
                        ticketIdCol = 1;
                        nameCol = parts.length > 2 ? 2 : -1;
                        emailCol = parts.length > 3 ? 3 : -1;
                        phoneCol = parts.length > 4 ? 4 : -1;
                    } else if (parts[0].trim().startsWith("ILM-")) {
                        // Standard layout
                        ticketIdCol = 0;
                        nameCol = parts.length > 1 ? 1 : -1;
                        emailCol = parts.length > 2 ? 2 : -1;
                        phoneCol = parts.length > 3 ? 3 : -1;
                    } else {
                        // Default fallback
                        ticketIdCol = 0;
                        nameCol = 1;
                        emailCol = 2;
                        phoneCol = 3;
                    }
                    headersResolved = true;
                }

                result.setTotalProcessed(result.getTotalProcessed() + 1);

                if (parts.length <= Math.max(ticketIdCol, nameCol)) {
                    result.setErrorCount(result.getErrorCount() + 1);
                    result.getErrors().add("Line " + lineNumber + ": Invalid format. Columns missing.");
                    continue;
                }

                String ticketId = parts[ticketIdCol].trim();
                String name = nameCol >= 0 && nameCol < parts.length ? parts[nameCol].trim() : "";
                String email = emailCol >= 0 && emailCol < parts.length ? parts[emailCol].trim() : "";
                String phone = phoneCol >= 0 && phoneCol < parts.length ? parts[phoneCol].trim() : "";

                if (ticketId.isEmpty() || name.isEmpty() || ticketId.equalsIgnoreCase("ticket_id") || ticketId.equalsIgnoreCase("registration number")) {
                    result.setErrorCount(result.getErrorCount() + 1);
                    result.getErrors().add("Line " + lineNumber + ": Ticket ID and Participant Name cannot be empty.");
                    continue;
                }

                if (seenInBatch.contains(ticketId)) {
                    result.setDuplicateCount(result.getDuplicateCount() + 1);
                    result.getErrors().add("Duplicate ticket ID in batch: " + ticketId);
                    continue;
                }

                seenInBatch.add(ticketId);

                // If ticket exists, update participant details to maintain real sync
                java.util.Optional<Ticket> existingOpt = ticketRepository.findByTicketId(ticketId);
                if (existingOpt.isPresent()) {
                    Ticket existing = existingOpt.get();
                    existing.setParticipantName(name);
                    if (!email.isEmpty()) existing.setEmail(email);
                    if (!phone.isEmpty()) existing.setPhone(phone);
                    toSave.add(existing);
                    result.getImportedTicketIds().add(ticketId);
                } else {
                    Ticket ticket = new Ticket(ticketId, name, email, phone);
                    ticket.setQrToken(UUID.randomUUID().toString());
                    toSave.add(ticket);
                    result.getImportedTicketIds().add(ticketId);
                }
            }

            if (!toSave.isEmpty()) {
                ticketRepository.saveAll(toSave);
                result.setImportedCount(toSave.size());
            }

        } catch (Exception e) {
            result.getErrors().add("Error reading CSV: " + e.getMessage());
        }

        return result;
    }

    private String[] parseCsvLine(String line) {
        List<String> tokens = new ArrayList<>();
        StringBuilder sb = new StringBuilder();
        boolean inQuotes = false;

        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);
            if (c == '\"') {
                inQuotes = !inQuotes;
            } else if (c == ',' && !inQuotes) {
                tokens.add(sb.toString());
                sb.setLength(0);
            } else {
                sb.append(c);
            }
        }
        tokens.add(sb.toString());
        return tokens.toArray(new String[0]);
    }

    @Transactional
    public boolean undoCheckin(String ticketId) {
        int updated = ticketRepository.undoCheckin(ticketId);
        return updated > 0;
    }

    @Transactional
    public boolean cancelTicket(String ticketId) {
        int updated = ticketRepository.cancelTicket(ticketId);
        return updated > 0;
    }

    @Transactional(readOnly = true)
    public String exportCsv() {
        List<Ticket> tickets = ticketRepository.findAll();
        StringBuilder sb = new StringBuilder();
        sb.append("Ticket ID,Participant Name,Email,Phone,Status,Checked In,Checked In At,Checked In By\n");

        for (Ticket t : tickets) {
            sb.append("\"").append(escapeCsv(t.getTicketId())).append("\",")
              .append("\"").append(escapeCsv(t.getParticipantName())).append("\",")
              .append("\"").append(escapeCsv(t.getEmail())).append("\",")
              .append("\"").append(escapeCsv(t.getPhone())).append("\",")
              .append("\"").append(t.getStatus()).append("\",")
              .append(t.isCheckedIn() ? "TRUE" : "FALSE").append(",")
              .append("\"").append(t.getCheckedInAt() != null ? t.getCheckedInAt().toString() : "").append("\",")
              .append("\"").append(escapeCsv(t.getCheckedInBy())).append("\"\n");
        }
        return sb.toString();
    }

    private String escapeCsv(String val) {
        if (val == null) return "";
        return val.replace("\"", "\"\"");
    }
}
