package com.illuminate.qr.controller;

import com.illuminate.qr.entity.Checkin;
import com.illuminate.qr.repository.CheckinRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/checkins")
public class CheckinController {

    private final CheckinRepository checkinRepository;

    public CheckinController(CheckinRepository checkinRepository) {
        this.checkinRepository = checkinRepository;
    }

    @GetMapping
    public ResponseEntity<List<Checkin>> getRecentCheckins() {
        return ResponseEntity.ok(checkinRepository.findTop50ByOrderByScannedAtDesc());
    }
}
