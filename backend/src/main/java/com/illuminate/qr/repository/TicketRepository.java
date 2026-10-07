package com.illuminate.qr.repository;

import com.illuminate.qr.entity.Ticket;
import com.illuminate.qr.entity.TicketStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {

    Optional<Ticket> findByTicketId(String ticketId);

    boolean existsByTicketId(String ticketId);

    long countByCheckedIn(boolean checkedIn);

    long countByStatus(TicketStatus status);

    @Query("SELECT t FROM Ticket t WHERE " +
           "(:query IS NULL OR :query = '' OR " +
           "LOWER(t.ticketId) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(t.participantName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(t.email) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(t.phone) LIKE LOWER(CONCAT('%', :query, '%'))) " +
           "AND (:status IS NULL OR t.status = :status) " +
           "ORDER BY t.id ASC")
    List<Ticket> searchTickets(@Param("query") String query, @Param("status") TicketStatus status);

    @Modifying
    @Query("UPDATE Ticket t SET t.checkedIn = true, t.status = com.illuminate.qr.entity.TicketStatus.USED, " +
           "t.checkedInAt = :checkedInAt, t.checkedInBy = :checkedInBy " +
           "WHERE t.ticketId = :ticketId AND t.checkedIn = false AND t.status = com.illuminate.qr.entity.TicketStatus.ACTIVE")
    int markCheckedInAtomically(
            @Param("ticketId") String ticketId,
            @Param("checkedInAt") LocalDateTime checkedInAt,
            @Param("checkedInBy") String checkedInBy
    );

    @Modifying
    @Query("UPDATE Ticket t SET t.checkedIn = false, t.status = com.illuminate.qr.entity.TicketStatus.ACTIVE, " +
           "t.checkedInAt = NULL, t.checkedInBy = NULL " +
           "WHERE t.ticketId = :ticketId")
    int undoCheckin(@Param("ticketId") String ticketId);

    @Modifying
    @Query("UPDATE Ticket t SET t.status = com.illuminate.qr.entity.TicketStatus.CANCELLED " +
           "WHERE t.ticketId = :ticketId")
    int cancelTicket(@Param("ticketId") String ticketId);
}
