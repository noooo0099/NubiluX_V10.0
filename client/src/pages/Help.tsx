import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  HelpCircle,
  MessageCircle,
  Mail,
  Phone,
  Search,
  Shield,
  CreditCard,
  Gamepad2,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  Send,
  TrendingUp
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const faqData = [
  {
    category: "Akun & Keamanan",
    icon: Shield,
    questions: [
      {
        q: "Bagaimana cara memverifikasi akun saya?",
        a: "Untuk memverifikasi akun, masuk ke Pengaturan > Verifikasi Akun, lalu upload foto KTP dan selfie dengan KTP. Proses verifikasi biasanya memakan waktu 1-3 hari kerja."
      },
      {
        q: "Apakah aman membeli akun gaming di NubiluXchange?",
        a: "Ya, kami menggunakan sistem escrow untuk melindungi pembeli dan penjual. Dana hanya akan dilepas setelah pembeli mengkonfirmasi akun gaming berfungsi dengan baik."
      },
      {
        q: "Bagaimana jika akun yang saya beli bermasalah?",
        a: "Jika akun bermasalah dalam 24 jam pertama, Anda bisa mengajukan dispute. Tim CS kami akan membantu mediasi dan memberikan solusi terbaik, termasuk refund jika diperlukan."
      }
    ]
  },
  {
    category: "Transaksi & Pembayaran",
    icon: CreditCard,
    questions: [
      {
        q: "Apa saja metode pembayaran yang tersedia?",
        a: "Kami menerima QRIS, transfer bank (BCA, Mandiri, BNI, BRI), e-wallet (GoPay, OVO, DANA), dan pulsa. Semua pembayaran diproses secara real-time."
      },
      {
        q: "Berapa lama proses pencairan dana penjualan?",
        a: "Setelah pembeli mengkonfirmasi akun, dana akan tersedia di wallet Anda. Proses penarikan ke rekening bank memakan waktu 1-2 jam pada jam kerja."
      },
      {
        q: "Apakah ada biaya transaksi?",
        a: "Ya, kami mengenakan fee 5% untuk setiap transaksi berhasil. Fee ini sudah termasuk biaya payment gateway dan escrow protection."
      }
    ]
  },
  {
    category: "Jual Beli Akun Gaming",
    icon: Gamepad2,
    questions: [
      {
        q: "Game apa saja yang bisa dijual di NubiluXchange?",
        a: "Kami mendukung hampir semua game populer seperti Mobile Legends, PUBG Mobile, Free Fire, Valorant, Genshin Impact, dan masih banyak lagi."
      },
      {
        q: "Bagaimana cara menentukan harga akun yang tepat?",
        a: "Gunakan fitur Price Estimator kami yang mempertimbangkan rank, level, skin, dan asset in-game lainnya. Anda juga bisa melihat harga akun serupa di marketplace."
      },
      {
        q: "Bolehkah menjual akun yang masih bind social media?",
        a: "Untuk keamanan, sebaiknya lepas semua social media binding sebelum dijual. Akun yang sudah unbind akan mendapat badge 'Safe Transfer' dan lebih laku."
      }
    ]
  },
  {
    category: "Komunitas & Aturan",
    icon: Users,
    questions: [
      {
        q: "Apa yang terjadi jika saya melanggar aturan komunitas?",
        a: "Pelanggaran ringan akan mendapat peringatan, pelanggaran berat seperti penipuan akan langsung banned permanen. Semua keputusan berdasarkan laporan dan investigasi tim moderator."
      },
      {
        q: "Bagaimana cara melaporkan penjual yang mencurigakan?",
        a: "Gunakan tombol 'Report' di profil penjual atau chat. Tim CS akan menginvestigasi dalam 24 jam dan mengambil tindakan jika terbukti melanggar."
      },
      {
        q: "Bisakah saya menjadi penjual terverifikasi?",
        a: "Ya, setelah 10 transaksi berhasil dengan rating 4.5+ dan verifikasi identitas lengkap, Anda bisa apply untuk status Verified Seller yang memberikan berbagai keuntungan."
      }
    ]
  }
];

export default function Help() {
  const [searchQuery, setSearchQuery] = useState("");
  const [contactForm, setContactForm] = useState({
    subject: "",
    message: "",
    email: "",
    category: "general"
  });
  const { toast } = useToast();

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate form submission
    toast({
      title: "Pesan berhasil dikirim!",
      description: "Tim customer service kami akan merespons dalam 24 jam.",
    });
    setContactForm({ subject: "", message: "", email: "", category: "general" });
  };

  const filteredFAQ = faqData.map(category => ({
    ...category,
    questions: category.questions.filter(
      item => 
        item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.a.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  return (
    <div className="min-h-screen bg-nxe-dark p-4">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-4 flex items-center justify-center">
          <HelpCircle className="h-8 w-8 mr-3 text-nxe-primary" />
          Pusat Bantuan
        </h1>
        <p className="text-nxe-text max-w-2xl mx-auto">
          Temukan jawaban untuk pertanyaan Anda atau hubungi tim support kami untuk bantuan lebih lanjut
        </p>
      </div>

      {/* Search Bar */}
      <div className="max-w-2xl mx-auto mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Cari bantuan, misal 'cara verifikasi akun'..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-nxe-surface border-nxe-border text-white placeholder-gray-400 h-12 text-lg"
            data-testid="input-help-search"
          />
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="faq" className="max-w-6xl mx-auto">
        <TabsList className="grid w-full grid-cols-3 bg-nxe-surface border border-nxe-border mb-8">
          <TabsTrigger 
            value="faq"
            className="data-[state=active]:bg-nxe-primary data-[state=active]:text-white"
          >
            FAQ
          </TabsTrigger>
          <TabsTrigger 
            value="contact"
            className="data-[state=active]:bg-nxe-primary data-[state=active]:text-white"
          >
            Hubungi Kami
          </TabsTrigger>
          <TabsTrigger 
            value="guides"
            className="data-[state=active]:bg-nxe-primary data-[state=active]:text-white"
          >
            Panduan
          </TabsTrigger>
        </TabsList>

        {/* FAQ Tab */}
        <TabsContent value="faq">
          {searchQuery && (
            <div className="mb-6">
              <p className="text-nxe-text">
                Menampilkan hasil untuk: <span className="text-white font-medium">"{searchQuery}"</span>
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredFAQ.length === 0 ? (
              <div className="col-span-2 text-center py-12">
                <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  Tidak ada hasil ditemukan
                </h3>
                <p className="text-nxe-text mb-4">
                  Coba ubah kata kunci pencarian atau hubungi customer service
                </p>
                <Button 
                  onClick={() => setSearchQuery("")}
                  variant="outline"
                  className="border-nxe-primary text-nxe-primary hover:bg-nxe-primary hover:text-white"
                >
                  Reset Pencarian
                </Button>
              </div>
            ) : (
              filteredFAQ.map((category, idx) => {
                const IconComponent = category.icon;
                return (
                  <Card key={idx} className="bg-nxe-surface border-nxe-border">
                    <CardHeader>
                      <CardTitle className="flex items-center text-white">
                        <div className="p-2 bg-nxe-primary/20 rounded-lg mr-3">
                          <IconComponent className="h-5 w-5 text-nxe-primary" />
                        </div>
                        {category.category}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Accordion type="single" collapsible className="w-full">
                        {category.questions.map((faq, faqIdx) => (
                          <AccordionItem key={faqIdx} value={`${idx}-${faqIdx}`} className="border-nxe-border">
                            <AccordionTrigger className="text-left text-white hover:text-nxe-primary">
                              {faq.q}
                            </AccordionTrigger>
                            <AccordionContent className="text-nxe-text">
                              {faq.a}
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        {/* Contact Tab */}
        <TabsContent value="contact">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Contact Form */}
            <Card className="bg-nxe-surface border-nxe-border">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <MessageCircle className="h-5 w-5 mr-2 text-nxe-primary" />
                  Kirim Pesan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-white mb-2 block">
                      Email
                    </label>
                    <Input
                      type="email"
                      placeholder="email@domain.com"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                      className="bg-nxe-dark border-nxe-border text-white"
                      required
                      data-testid="input-contact-email"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-white mb-2 block">
                      Kategori
                    </label>
                    <select 
                      value={contactForm.category}
                      onChange={(e) => setContactForm({...contactForm, category: e.target.value})}
                      className="w-full p-2 bg-nxe-dark border border-nxe-border rounded-md text-white"
                      data-testid="select-contact-category"
                    >
                      <option value="general">Pertanyaan Umum</option>
                      <option value="technical">Masalah Teknis</option>
                      <option value="payment">Pembayaran</option>
                      <option value="dispute">Dispute/Keluhan</option>
                      <option value="account">Akun & Verifikasi</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-white mb-2 block">
                      Subjek
                    </label>
                    <Input
                      type="text"
                      placeholder="Ringkasan singkat masalah Anda"
                      value={contactForm.subject}
                      onChange={(e) => setContactForm({...contactForm, subject: e.target.value})}
                      className="bg-nxe-dark border-nxe-border text-white"
                      required
                      data-testid="input-contact-subject"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-white mb-2 block">
                      Pesan
                    </label>
                    <Textarea
                      placeholder="Jelaskan masalah Anda secara detail..."
                      value={contactForm.message}
                      onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                      className="bg-nxe-dark border-nxe-border text-white min-h-[120px]"
                      required
                      data-testid="textarea-contact-message"
                    />
                  </div>
                  
                  <Button 
                    type="submit"
                    className="w-full bg-nxe-primary hover:bg-nxe-primary/80 text-white"
                    data-testid="button-send-message"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Kirim Pesan
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Contact Methods */}
            <div className="space-y-6">
              <Card className="bg-nxe-surface border-nxe-border">
                <CardHeader>
                  <CardTitle className="text-white">Kontak Langsung</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3 p-3 bg-nxe-dark rounded-lg">
                    <Mail className="h-5 w-5 text-nxe-primary" />
                    <div>
                      <p className="text-white font-medium">Email Support</p>
                      <p className="text-nxe-text text-sm">support@nubiluxchange.com</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-3 bg-nxe-dark rounded-lg">
                    <Phone className="h-5 w-5 text-nxe-primary" />
                    <div>
                      <p className="text-white font-medium">WhatsApp CS</p>
                      <p className="text-nxe-text text-sm">+62 812-3456-7890</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-3 bg-nxe-dark rounded-lg">
                    <MessageCircle className="h-5 w-5 text-nxe-primary" />
                    <div>
                      <p className="text-white font-medium">Live Chat</p>
                      <p className="text-nxe-text text-sm">Tersedia 24/7</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Response Time */}
              <Card className="bg-nxe-surface border-nxe-border">
                <CardHeader>
                  <CardTitle className="text-white">Waktu Respons</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <span className="text-white">Urgent</span>
                    </div>
                    <Badge className="bg-red-600 text-white">&lt; 1 jam</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-yellow-500" />
                      <span className="text-white">Normal</span>
                    </div>
                    <Badge className="bg-yellow-600 text-white">&lt; 24 jam</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-white">General</span>
                    </div>
                    <Badge className="bg-green-600 text-white">1-3 hari</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Guides Tab */}
        <TabsContent value="guides">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: "Panduan Pembeli Pemula",
                description: "Langkah-langkah aman membeli akun gaming untuk pertama kali",
                icon: Shield,
                color: "bg-blue-600"
              },
              {
                title: "Tips Menjual Efektif",
                description: "Strategi untuk menjual akun gaming dengan harga optimal",
                icon: TrendingUp,
                color: "bg-green-600"
              },
              {
                title: "Keamanan Transaksi",
                description: "Cara melindungi diri dari penipuan dan scammer",
                icon: Shield,
                color: "bg-red-600"
              },
              {
                title: "Verifikasi Akun",
                description: "Proses lengkap verifikasi identitas untuk keamanan",
                icon: CheckCircle,
                color: "bg-purple-600"
              },
              {
                title: "Sistem Escrow",
                description: "Memahami bagaimana escrow melindungi transaksi Anda",
                icon: CreditCard,
                color: "bg-orange-600"
              },
              {
                title: "Komunitas & Aturan",
                description: "Panduan berperilaku di komunitas NubiluXchange",
                icon: Users,
                color: "bg-cyan-600"
              }
            ].map((guide, idx) => {
              const IconComponent = guide.icon;
              return (
                <Card 
                  key={idx} 
                  className="bg-nxe-surface border-nxe-border hover:border-nxe-primary/50 transition-colors cursor-pointer group"
                >
                  <CardContent className="p-6">
                    <div className={`p-4 ${guide.color} rounded-lg mb-4 group-hover:scale-110 transition-transform duration-200`}>
                      <IconComponent className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-nxe-primary transition-colors">
                      {guide.title}
                    </h3>
                    <p className="text-nxe-text text-sm">
                      {guide.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}