package com.paygate.smsforwarder

/**
 * Bank Detection Helper - ตรวจจับธนาคารและข้อความเงินเข้า
 */
object BankDetector {

    // Package names ของแอปธนาคาร
    private val BANK_PACKAGES = mapOf(
        // SCB
        "com.scb.phone" to BankInfo("SCB", "ธนาคารไทยพาณิชย์"),
        "com.scb.easy" to BankInfo("SCB", "ธนาคารไทยพาณิชย์"),
        "com.scb.corporate" to BankInfo("SCB", "ธนาคารไทยพาณิชย์"),
        "com.scbbiznet" to BankInfo("SCB", "ธนาคารไทยพาณิชย์"),
        "com.SCBBizNet" to BankInfo("SCB", "ธนาคารไทยพาณิชย์"),
        
        // KBANK
        "com.kasikorn.retail.mbanking.wap" to BankInfo("KBANK", "ธนาคารกสิกรไทย"),
        "com.kasikornbank.kplus" to BankInfo("KBANK", "ธนาคารกสิกรไทย"),
        
        // KTB Krungthai
        "com.ktb.netbank" to BankInfo("KTB", "ธนาคารกรุงไทย"),
        "th.co.ktb.next" to BankInfo("KTB", "ธนาคารกรุงไทย"),
        "ktbcs.netbank" to BankInfo("KTB", "ธนาคารกรุงไทย"),
        
        // BBL Bangkok Bank
        "com.bbl.mobilebanking" to BankInfo("BBL", "ธนาคารกรุงเทพ"),
        "com.bbl.mobilebanking.bualuang" to BankInfo("BBL", "ธนาคารกรุงเทพ"),
        
        // BAY Krungsri
        "com.krungsri.kma" to BankInfo("BAY", "ธนาคารกรุงศรี"),
        "com.krungsri.mobilebanking" to BankInfo("BAY", "ธนาคารกรุงศรี"),
        
        // GSB
        "com.gsb.mobilebanking" to BankInfo("GSB", "ธนาคารออมสิน"),
        "com.gsb.mobilebanking.th" to BankInfo("GSB", "ธนาคารออมสิน"),
        
        // TTB
        "th.co.tmb.core.android.tmbtouchv2" to BankInfo("TTB", "ธนาคารทหารไทยธนชาต"),
        "com.ttbbank.oneapp" to BankInfo("TTB", "ธนาคารทหารไทยธนชาต"),
        
        // CIMB
        "com.cimb.th.mobilebanking" to BankInfo("CIMB", "ธนาคารซีไอเอ็มบี"),
        
        // KKP
        "com.kkp.mobilebanking" to BankInfo("KKP", "ธนาคารเกียรตินาคินภัทร"),
        
        // UOB
        "com.uob.mobilebanking" to BankInfo("UOB", "ธนาคารยูโอบี"),
        
        // TISCO
        "com.tisco.mobilebanking" to BankInfo("TISCO", "ธนาคารทิสโก้"),
        
        // LH Bank
        "com.lhbank.mobilebanking" to BankInfo("LHBANK", "ธนาคารแลนด์ แอนด์ เฮ้าส์"),
        
        // BAAC
        "com.baac.mobilebanking" to BankInfo("BAAC", "ธนาคาร ธ.ก.ส."),
        
        // GHB
        "com.ghb.mobilebanking" to BankInfo("GHB", "ธนาคารอาคารสงเคราะห์"),
        
        // LINE BK
        "jp.naver.line.biz.linebk" to BankInfo("LINEBK", "LINE BK"),
        
        // TrueMoney
        "com.truemoney.wallet" to BankInfo("TRUEMONEY", "TrueMoney Wallet"),
        
        // PromptPay
        "th.or.nitmx.itmx.promptpay" to BankInfo("PROMPTPAY", "PromptPay")
    )

    // SMS Senders
    private val SMS_SENDERS = mapOf(
        "SCB" to BankInfo("SCB", "ธนาคารไทยพาณิชย์"),
        "SCBEASY" to BankInfo("SCB", "ธนาคารไทยพาณิชย์"),
        "SCB EASY" to BankInfo("SCB", "ธนาคารไทยพาณิชย์"),
        "SCB BUSINESS ANYWHERE" to BankInfo("SCB", "ธนาคารไทยพาณิชย์"),
        "SCB BUSINESS NET" to BankInfo("SCB", "ธนาคารไทยพาณิชย์"),
        "KBANK" to BankInfo("KBANK", "ธนาคารกสิกรไทย"),
        "K PLUS" to BankInfo("KBANK", "ธนาคารกสิกรไทย"),
        "KASIKORN" to BankInfo("KBANK", "ธนาคารกสิกรไทย"),
        "KTB" to BankInfo("KTB", "ธนาคารกรุงไทย"),
        "KRUNGTHAI" to BankInfo("KTB", "ธนาคารกรุงไทย"),
        "BBL" to BankInfo("BBL", "ธนาคารกรุงเทพ"),
        "BANGKOK BANK" to BankInfo("BBL", "ธนาคารกรุงเทพ"),
        "BAY" to BankInfo("BAY", "ธนาคารกรุงศรี"),
        "KRUNGSRI" to BankInfo("BAY", "ธนาคารกรุงศรี"),
        "GSB" to BankInfo("GSB", "ธนาคารออมสิน"),
        "TTB" to BankInfo("TTB", "ธนาคารทหารไทยธนชาต"),
        "TMB" to BankInfo("TTB", "ธนาคารทหารไทยธนชาต"),
        "CIMB" to BankInfo("CIMB", "ธนาคารซีไอเอ็มบี"),
    )

    // คำที่บ่งบอกว่าเป็นเงินเข้า
    private val INCOME_KEYWORDS = listOf(
        // ไทย
        "รับโอน", "เงินเข้า", "โอนเข้า", "ได้รับ", "รับเงิน", 
        "เข้าบัญชี", "เข้าบ/ช", "เงินโอนจาก", "ฝากเงิน", "รับฝาก", "เติมเงิน", "ยอดเข้า", "คืนเงิน", "รับชำระ",
        // English
        "received", "transfer in", "credited", "deposit", 
        "incoming", "payment received", "refund"
    )

    // คำที่บ่งบอกว่าเป็นเงินออก (ไม่ต้องประมวลผล)
    private val EXPENSE_KEYWORDS = listOf(
        "โอนออก", "ถอนเงิน", "ชำระค่า", "ชำระบิล", "ชำระยอด", "จ่าย", "หักเงิน", "หักบัญชี",
        "transferred", "paid", "withdrawn", "debited"
    )

    // คำที่บ่งบอกว่าเป็นรายการเคลื่อนไหวบัญชี (เข้า/ออก)
    private val TRANSACTION_KEYWORDS = listOf(
        "รับโอน", "เงินเข้า", "โอนเข้า", "ได้รับ", "รับเงิน", "เข้าบัญชี", "เข้าบ/ช", "เงินโอนจาก",
        "โอนออก", "ถอนเงิน", "ชำระ", "จ่าย", "หักเงิน", "หักบัญชี",
        "received", "credited", "deposit", "incoming",
        "transfer", "transferred", "withdrawn", "debited", "paid", "payment"
    )

    /**
     * ตรวจสอบว่าเป็นแอปธนาคาร
     */
    fun isBankApp(packageName: String): Boolean {
        return BANK_PACKAGES.containsKey(packageName)
    }

    /**
     * ดึงข้อมูลธนาคารจาก package name
     */
    fun getBankFromPackage(packageName: String): BankInfo? {
        return BANK_PACKAGES[packageName]
    }

    /**
     * ดึงข้อมูลธนาคารจาก SMS sender
     */
    fun getBankFromSender(sender: String): BankInfo? {
        val upperSender = sender.uppercase()
        return SMS_SENDERS.entries.find { 
            upperSender.contains(it.key) 
        }?.value
    }

    /**
     * พยายามเดาธนาคารจาก notification เมื่อ package ใหม่ยังไม่อยู่ใน whitelist
     */
    fun detectBankFromNotification(packageName: String, message: String): BankInfo? {
        val normalizedPackage = packageName.lowercase()
        val normalizedMessage = message.lowercase()

        // ใช้ package-based hints เป็นลำดับแรก (ป้องกัน false positive จากข้อความทั่วไป)
        if (normalizedPackage.startsWith("com.scb") || normalizedPackage.contains("scb")) {
            return BankInfo("SCB", "ธนาคารไทยพาณิชย์")
        }

        // Fallback จากเนื้อข้อความ
        if (
            normalizedMessage.contains("scb") ||
            normalizedMessage.contains("ไทยพาณิชย์") ||
            normalizedMessage.contains("business anywhere") ||
            normalizedMessage.contains("business net")
        ) {
            return BankInfo("SCB", "ธนาคารไทยพาณิชย์")
        }

        return null
    }

    /**
     * ตรวจสอบว่าเป็นข้อความเงินเข้า
     */
    fun isIncomeMessage(message: String): Boolean {
        val lowerMessage = message.lowercase()
        
        // ตรวจสอบว่าไม่ใช่เงินออก
        if (EXPENSE_KEYWORDS.any { lowerMessage.contains(it.lowercase()) }) {
            return false
        }
        
        // ตรวจสอบว่าเป็นเงินเข้า
        return INCOME_KEYWORDS.any { lowerMessage.contains(it.lowercase()) }
    }

    /**
     * ตรวจสอบว่าเป็นข้อความรายการธุรกรรม (เงินเข้า/เงินออก)
     */
    fun isTransactionMessage(message: String): Boolean {
        val lowerMessage = message.lowercase()
        val hasKeyword = TRANSACTION_KEYWORDS.any { lowerMessage.contains(it.lowercase()) }
        val hasAmount = Regex("""\b\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?\b""").containsMatchIn(message)
        return hasKeyword && hasAmount
    }

    /**
     * ตรวจสอบ hint ว่าเป็นข้อความการเงิน แม้ keyword ธุรกรรมจะไม่ครบ
     */
    fun hasMoneyHint(message: String): Boolean {
        val lowerMessage = message.lowercase()
        val moneyKeywords = listOf("บาท", "฿", "thb", "baht", "คงเหลือ", "balance", "ยอดเงิน")
        val hasMoneyKeyword = moneyKeywords.any { lowerMessage.contains(it) }
        val hasAmount = Regex("""\b\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?\b""").containsMatchIn(message)
        return hasMoneyKeyword || hasAmount
    }

    /**
     * ตรวจสอบว่าเป็น SMS จากธนาคาร
     */
    fun isBankSms(sender: String, message: String): Boolean {
        val hasBankSender = SMS_SENDERS.keys.any { 
            sender.uppercase().contains(it) 
        }
        
        val hasIncomeKeyword = isIncomeMessage(message)
        
        return hasBankSender || hasIncomeKeyword
    }

    /**
     * รายการ package ธนาคารทั้งหมด
     */
    fun getAllBankPackages(): List<String> = BANK_PACKAGES.keys.toList()

    /**
     * รายการธนาคารทั้งหมด
     */
    fun getAllBanks(): List<BankInfo> = BANK_PACKAGES.values.distinctBy { it.code }
}

data class BankInfo(
    val code: String,
    val nameTH: String
)
