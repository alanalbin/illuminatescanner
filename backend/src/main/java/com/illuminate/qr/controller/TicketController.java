package com.illuminate.qr.controller;

import com.illuminate.qr.dto.*;
import com.illuminate.qr.entity.TicketStatus;
import com.illuminate.qr.service.CheckinService;
import com.illuminate.qr.service.QrCodeService;
import com.illuminate.qr.service.TicketService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tickets")
public class TicketController {

    private final TicketService ticketService;
    private final CheckinService checkinService;
    private final QrCodeService qrCodeService;

    @Value("${app.domain:http://localhost:5173}")
    private String appDomain;

    public TicketController(TicketService ticketService, CheckinService checkinService, QrCodeService qrCodeService) {
        this.ticketService = ticketService;
        this.checkinService = checkinService;
        this.qrCodeService = qrCodeService;
    }

    @GetMapping
    public ResponseEntity<List<TicketResponse>> getTickets(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) TicketStatus status) {
        return ResponseEntity.ok(ticketService.getTickets(query, status));
    }

    @GetMapping("/{ticketId}")
    public ResponseEntity<TicketResponse> getTicket(@PathVariable String ticketId) {
        return ResponseEntity.ok(ticketService.getTicketByTicketId(ticketId));
    }

    @PostMapping
    public ResponseEntity<TicketResponse> createTicket(@Valid @RequestBody TicketRequest request) {
        return ResponseEntity.ok(ticketService.createTicket(request));
    }

    @PostMapping("/import")
    public ResponseEntity<BulkImportResult> importCsv(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(ticketService.importCsv(file));
    }

    @GetMapping("/export")
    public ResponseEntity<byte[]> exportCsv() {
        String csv = ticketService.exportCsv();
        byte[] bytes = csv.getBytes(java.nio.charset.StandardCharsets.UTF_8);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"illuminate_tickets_export.csv\"")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(bytes);
    }

    @PostMapping("/validate")
    public ResponseEntity<CheckinResponse> validateTicket(@RequestBody Map<String, String> body) {
        String qrContent = body.get("qrContent");
        if (qrContent == null && body.containsKey("ticketId")) {
            qrContent = body.get("ticketId");
        }
        return ResponseEntity.ok(checkinService.validateTicket(qrContent));
    }

    @PostMapping("/checkin")
    public ResponseEntity<CheckinResponse> checkin(@Valid @RequestBody CheckinRequest request) {
        return ResponseEntity.ok(checkinService.processCheckin(request));
    }

    @PostMapping("/{ticketId}/checkin")
    public ResponseEntity<CheckinResponse> checkinByPath(
            @PathVariable String ticketId,
            @RequestBody(required = false) Map<String, String> body) {
        CheckinRequest req = new CheckinRequest();
        req.setQrContent(ticketId);
        if (body != null) {
            req.setScannedBy(body.get("scannedBy"));
            req.setDeviceInfo(body.get("deviceInfo"));
        }
        return ResponseEntity.ok(checkinService.processCheckin(req));
    }

    @PostMapping("/{ticketId}/undo-checkin")
    public ResponseEntity<Map<String, Object>> undoCheckin(@PathVariable String ticketId) {
        boolean success = ticketService.undoCheckin(ticketId);
        Map<String, Object> res = new HashMap<>();
        res.put("success", success);
        res.put("ticketId", ticketId);
        res.put("message", success ? "Check-in undone successfully" : "Ticket not found");
        return ResponseEntity.ok(res);
    }

    @PostMapping("/{ticketId}/cancel")
    public ResponseEntity<Map<String, Object>> cancelTicket(@PathVariable String ticketId) {
        boolean success = ticketService.cancelTicket(ticketId);
        Map<String, Object> res = new HashMap<>();
        res.put("success", success);
        res.put("ticketId", ticketId);
        res.put("message", success ? "Ticket cancelled" : "Ticket not found");
        return ResponseEntity.ok(res);
    }

    @GetMapping(value = "/{ticketId}/qr", produces = MediaType.IMAGE_PNG_VALUE)
    public ResponseEntity<byte[]> getQrImage(
            @PathVariable String ticketId,
            @RequestParam(defaultValue = "400") int size) {
        try {
            // High-resolution scannable QR verification URL format
            String domain = appDomain.replaceAll("/$", "");
            String verifyUrl = domain + "/verify/" + ticketId;
            byte[] image = qrCodeService.generateQrCodeImage(verifyUrl, size, size);
            return ResponseEntity.ok().contentType(MediaType.IMAGE_PNG).body(image);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/{ticketId}/pass")
    public ResponseEntity<Map<String, Object>> getDigitalPass(@PathVariable String ticketId) {
        try {
            TicketResponse ticket = ticketService.getTicketByTicketId(ticketId);
            String domain = appDomain.replaceAll("/$", "");
            String verifyUrl = domain + "/verify/" + ticketId;
            String qrBase64 = qrCodeService.generateQrCodeBase64(verifyUrl, 450, 450);

            Map<String, Object> response = new HashMap<>();
            response.put("ticket", ticket);
            response.put("qrBase64", qrBase64);
            response.put("verifyUrl", verifyUrl);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
}
