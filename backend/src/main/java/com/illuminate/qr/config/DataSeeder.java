package com.illuminate.qr.config;

import com.illuminate.qr.entity.EventSettings;
import com.illuminate.qr.entity.Ticket;
import com.illuminate.qr.entity.User;
import com.illuminate.qr.repository.EventSettingsRepository;
import com.illuminate.qr.repository.TicketRepository;
import com.illuminate.qr.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Component
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final EventSettingsRepository settingsRepository;
    private final TicketRepository ticketRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(UserRepository userRepository,
                      EventSettingsRepository settingsRepository,
                      TicketRepository ticketRepository,
                      PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.settingsRepository = settingsRepository;
        this.ticketRepository = ticketRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        seedUsers();
        seedSettings();
        seedInitialTickets();
    }

    private void seedUsers() {
        if (!userRepository.existsByUsername("admin")) {
            User admin = new User(
                    "admin",
                    passwordEncoder.encode("admin123"),
                    "Illuminate Administrator",
                    "ROLE_ADMIN"
            );
            userRepository.save(admin);
        }

        if (!userRepository.existsByUsername("admin@illuminate.kmct.in")) {
            User adminEmail = new User(
                    "admin@illuminate.kmct.in",
                    passwordEncoder.encode("admin123"),
                    "Illuminate Admin",
                    "ROLE_ADMIN"
            );
            userRepository.save(adminEmail);
        }
    }

    private void seedSettings() {
        if (settingsRepository.count() == 0) {
            EventSettings settings = new EventSettings();
            settings.setEventName("ILLUMINATE");
            settings.setOrganizer("IIT Bombay E-Cell / KMCT");
            settings.setEventYear("2026");
            settings.setEventDate("October 2026");
            settings.setVenue("KMCT Campus Auditorium");
            settings.setLogoUrl("/logos/ecell-iitb.png");
            settings.setTheme("PURPLE_BLACK");
            settingsRepository.save(settings);
        }
    }

    private void seedInitialTickets() {
        List<Ticket> officialTickets = Arrays.asList(
            new Ticket("ILM-KMCT-MUTBSJW5-AED124", "Aryananda M", "aryanandamozhutharan2008@gmail.com", "9496934795"),
            new Ticket("ILM-KMCT-MUTCBR59-C9F1E2", "Bhavya Shree", "bhavysh48@gmail.com", "9778508459"),
            new Ticket("ILM-KMCT-MUTD4OFR-2F58F8", "Arya Vijayan", "aryavijayan0391@gmail.com", "9074726063"),
            new Ticket("ILM-KMCT-MUTEM1C5-8B8FC3", "Amna Farhath", "farhathamna126@gmail.com", "9562434134"),
            new Ticket("ILM-KMCT-MUTEJ7K1-9F2D3A", "Fathima Shiza", "shizafathima184@gmail.com", "9446670800"),
            new Ticket("ILM-KMCT-MUTXTA94-0A5E67", "Fathimath Basila", "fathimathbasila09@gmail.com", "7909143915"),
            new Ticket("ILM-KMCT-MUV4LVTV-182197", "Fathima Mansoor", "fathimamansoor512@gmail.com", "9497277081"),
            new Ticket("ILM-KMCT-MUV5EFWV-E9622D", "Ibrahim khaleel K M", "epipokhaleel@gmail.com", "9496290313"),
            new Ticket("ILM-KMCT-MUVAQH3B-E301AC", "Aysha Mifa", "ayshamifa595@gmail.com", "8594035626"),
            new Ticket("ILM-KMCT-MUVBI6RI-A09ECA", "Fathimath Shahama TA", "shaharbansharu0407@gmail.com", "8547584206"),
            new Ticket("ILM-KMCT-MUVCJAH9-CFB63A", "Razil Abdulla", "razilabdulla36@gmail.com", "9446480616"),
            new Ticket("ILM-KMCT-MUVDFXHA-9A7899", "Nafeesa Saniyya", "saniyyanafeesa3@gmail.com", "9567719604"),
            new Ticket("ILM-KMCT-MUV6DPXC-F4F823", "Fida Faisal", "fidafaesal@gmail.com", "8921388477"),
            new Ticket("ILM-KMCT-MUV6DRJB-62E58F", "Sheza Fathima", "shezafathima0357@gmail.com", "8129900357"),
            new Ticket("ILM-KMCT-MUVAFMLG-6BF727", "Nidha Shirin", "nidhashirin2220@gmail.com", "9495240471"),
            new Ticket("ILM-KMCT-MUVEWGG7-C833E6", "Azzath PA", "abdullakunhips10@gmail.com", "8848273036"),
            new Ticket("ILM-KMCT-MUVF9JZE-7FB0DD", "Khadeejath samnas MT", "thahiramusthafa5276@gmail.com", "9747897080"),
            new Ticket("ILM-KMCT-MUVFXXIC-3659F2", "Ahamad Anees CA", "ahamadaneesca14@gmail.com", "9846278912"),
            new Ticket("ILM-KMCT-MUVGNIT6-87B85E", "Habeezer Ali", "habeezerali20@gmail.com", "7034221452"),
            new Ticket("ILM-KMCT-MUVHEQNV-0D647F", "Aysha Zulfa", "azulfa1123@gmail.com", "9496498963"),
            new Ticket("ILM-KMCT-MUVHK2MU-38412F", "Sulaikha shahala ak", "ayshathraseena49@gmail.com", "9633106785"),
            new Ticket("ILM-KMCT-MUVJIV2B-676B39", "K S Shahzaman", "ksshahzaman5@gmail.com", "7907126335"),
            new Ticket("ILM-KMCT-MUVH9UUG-7D6997", "Fathima Sheza KH", "shezakh001@gmail.com", "9895534817"),
            new Ticket("ILM-KMCT-MUW21VK8-FEAB0A", "Hamraz Akmal", "hamrazakmal123@gmail.com", "7025793611"),
            new Ticket("ILM-KMCT-MUW5L9VV-71A713", "Mohammed Bilal", "billabilmohd@gmail.com", "9447179185"),
            new Ticket("ILM-KMCT-MUW9Z2IF-D56478", "FATHIMA RIZA", "fathimariza0512@gmail.com", "9495040547"),
            new Ticket("ILM-KMCT-MUWD8NLH-C9288C", "Fathima ahammed", "fathima@kmct.edu.in", "9292210284"),
            new Ticket("ILM-KMCT-MUWD9KAD-4B2DD7", "Kadeejath Mashmooma", "kadeejathmashmooma@gmail.com", "9048883434"),
            new Ticket("ILM-KMCT-MUWNA8YF-D10523", "Akshay Kumar", "akshaykumar242484@gmail.com", "7012653335"),
            new Ticket("ILM-KMCT-MUWQ1OVX-B67F9B", "Khadeejath Arfana", "arfanaappi10@gmail.com", "8129504013"),
            new Ticket("ILM-KMCT-MUWTIYWJ-1D4974", "Nidha Fathima", "fnidha628@gmail.com", "7736117557"),
            new Ticket("ILM-KMCT-MUWU7D04-3F5A7E", "Fathima Nooha Aboobacker", "fathimanoohaaboobacker@gmail.com", "8943795017"),
            new Ticket("ILM-KMCT-MUWTL95T-141AD0", "Muhammed Zeeshan", "muhdzeeshann@gmail.com", "8129112711"),
            new Ticket("ILM-KMCT-MUWU78Z8-9982F4", "Shivarjun S M", "shivarjunsm20@gmail.com", "7592882518"),
            new Ticket("ILM-KMCT-MUXJPFS0-797946", "Hisham abdulla", "hishamabdulla269@gmail.com", "7012984673"),
            new Ticket("ILM-KMCT-MUXKIC2D-71EB4E", "Ayshath Shua", "shuaayshath@gmail.com", "7306753675"),
            new Ticket("ILM-KMCT-MUXP4TXM-342433", "ABDULLA P", "abdullabinnizar@gmail.com", "9207370942"),
            new Ticket("ILM-KMCT-MUXPDNGK-B06807", "Muhammad Rishad kr", "byrishad@gmail.com", "8714661917"),
            new Ticket("ILM-KMCT-MUXZU1HH-3F3DD4", "RIHANA FATHIMA T I", "rihanafathimati@gmail.com", "9744227948"),
            new Ticket("ILM-KMCT-MUY1DFL7-AEEF85", "RAFEEA K", "rafeearazzak@gmail.com", "8848802069"),
            new Ticket("ILM-KMCT-MUY2S1KT-9E6B44", "Fathima zuhi", "zuhi44729@gmail.com", "8891122521"),
            new Ticket("ILM-KMCT-MUY6PAUJ-684B6E", "NAFEESATH NIDHA M H", "nidhanooruddeen@gmail.com", "9995999392"),
            new Ticket("ILM-KMCT-MUY8L2KJ-21DB05", "Musavvir Mihad", "musavvirmihad8@gmail.com", "7560984654"),
            new Ticket("ILM-KMCT-MUYBKAIC-3504DE", "zekyath fathima", "zekya007@gmail.com", "8089583662"),
            new Ticket("ILM-KMCT-MUYD5E77-9A287B", "Fathima st", "yahusami8675@gmail.com", "9496400819"),
            new Ticket("ILM-KMCT-MUYX02JJ-4F17A0", "Fathima Riza", "rizaibrahim1514@gmail.com", "9895202606"),
            new Ticket("ILM-KMCT-MUYYMONQ-E7770A", "Diya", "diya66086@gmail.com", "7736279126"),
            new Ticket("ILM-KMCT-MUYYT88P-E4A85B", "Lulu Fathima", "farorofa424@gmail.com", "9987491849"),
            new Ticket("ILM-KMCT-MUYYVX55-DFC01F", "Ayishath Thamanna kp", "ayshathamanna05@gmail.com", "8089830340"),
            new Ticket("ILM-KMCT-MUZ8DT5S-ADEDA4", "Mohammed K N", "mohammed996282@gmail.com", "9526602008"),
            new Ticket("ILM-KMCT-MUZ9IUZX-83E48B", "Sara Sara", "saraaahuh771@gmail.com", "8891331518")
        );

        for (Ticket ticket : officialTickets) {
            if (!ticketRepository.existsByTicketId(ticket.getTicketId())) {
                ticket.setQrToken(UUID.randomUUID().toString());
                ticketRepository.save(ticket);
            }
        }
    }
}
