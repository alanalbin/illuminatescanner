package com.illuminate.qr.repository;

import com.illuminate.qr.entity.Checkin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CheckinRepository extends JpaRepository<Checkin, Long> {

    List<Checkin> findTop50ByOrderByScannedAtDesc();

    long countByResult(String result);

    long countByResultIn(List<String> results);
}
