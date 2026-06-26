package com.paygate.smsforwarder

import android.content.Context
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.text.SimpleDateFormat
import java.util.*

/**
 * API Helper - จัดการการส่งข้อมูลไป Backend
 */
object ApiHelper {

    private const val TAG = "ApiHelper"
    
    // Leave blank by default — operator should point the app at the active 456 Cafe API.
    const val DEFAULT_API_URL = ""

    /**
     * Get API URL from SharedPreferences or use default
     */
    private fun getApiUrl(context: Context): String {
        val prefs = context.getSharedPreferences("PayGateSMS", Context.MODE_PRIVATE)
        val savedUrl = prefs.getString("api_url", "") ?: ""
        return if (savedUrl.isNotEmpty()) savedUrl else DEFAULT_API_URL
    }

    /**
     * ส่ง SMS/Notification ไปยัง API
     */
    suspend fun sendToApi(
        context: Context,
        sender: String,
        message: String,
        timestamp: Long,
        source: String = "sms",
        packageName: String? = null
    ): Result<ApiResponse> = withContext(Dispatchers.IO) {
        try {
            val prefs = context.getSharedPreferences("PayGateSMS", Context.MODE_PRIVATE)
            val apiUrl = getApiUrl(context)
            val authToken = prefs.getString("auth_token", "") ?: ""  // JWT token from login
            val isEnabled = prefs.getBoolean("enabled", true)

            if (!isEnabled) {
                return@withContext Result.failure(Exception("Service disabled"))
            }

            if (apiUrl.isEmpty()) {
                return@withContext Result.failure(Exception("API URL not configured"))
            }

            if (authToken.isEmpty()) {
                return@withContext Result.failure(Exception("Authentication required. Please login again."))
            }

            val dateFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US)
            dateFormat.timeZone = TimeZone.getTimeZone("UTC")

            val json = JSONObject().apply {
                put("sender", sender)
                put("message", message)
                put("timestamp", dateFormat.format(Date(timestamp)))
                put("source", source)
                put("deviceId", android.os.Build.MODEL)
                if (!packageName.isNullOrBlank()) {
                    put("packageName", packageName)
                }
            }

            val url = URL("$apiUrl/api/sms/incoming")
            val connection = url.openConnection() as HttpURLConnection

            connection.apply {
                requestMethod = "POST"
                setRequestProperty("Content-Type", "application/json")
                setRequestProperty("Authorization", "Bearer $authToken")
                doOutput = true
                connectTimeout = 15000
                readTimeout = 15000
            }

            connection.outputStream.use { os ->
                os.write(json.toString().toByteArray(Charsets.UTF_8))
            }

            val responseCode = connection.responseCode
            val responseBody = if (responseCode in 200..299) {
                connection.inputStream.bufferedReader().readText()
            } else {
                connection.errorStream?.bufferedReader()?.readText() ?: "Unknown error"
            }

            connection.disconnect()

            // บันทึก Log
            saveLog(context, sender, message, source, 
                if (responseCode in 200..299) "SUCCESS" else "FAILED: $responseCode")

            if (responseCode in 200..299) {
                val response = JSONObject(responseBody)
                Result.success(ApiResponse(
                    success = true,
                    matched = response.optBoolean("matched", false),
                    transactionId = response.optJSONObject("transaction")?.optString("id"),
                    message = "ส่งสำเร็จ"
                ))
            } else {
                Result.failure(Exception("HTTP $responseCode: $responseBody"))
            }

        } catch (e: Exception) {
            saveLog(context, sender, message, source, "ERROR: ${e.message}")
            Result.failure(e)
        }
    }

    /**
     * ทดสอบการเชื่อมต่อ
     * Uses JWT token only
     */
    suspend fun testConnection(context: Context): Boolean = withContext(Dispatchers.IO) {
        try {
            val prefs = context.getSharedPreferences("PayGateSMS", Context.MODE_PRIVATE)
            val apiUrl = getApiUrl(context)
            val authToken = prefs.getString("auth_token", "") ?: ""

            if (authToken.isEmpty()) {
                return@withContext false
            }
            
            val url = URL("$apiUrl/api/sms/test")
            val connection = url.openConnection() as HttpURLConnection

            connection.apply {
                requestMethod = "GET"
                setRequestProperty("Authorization", "Bearer $authToken")
                connectTimeout = 10000
                readTimeout = 10000
            }

            val responseCode = connection.responseCode
            connection.disconnect()

            responseCode == 200
        } catch (e: Exception) {
            false
        }
    }

    /**
     * บันทึก Log
     */
    fun saveLog(
        context: Context,
        sender: String,
        message: String,
        source: String,
        status: String
    ) {
        try {
            val prefs = context.getSharedPreferences("SmsLogs", Context.MODE_PRIVATE)
            val logs = prefs.getString("logs", "[]") ?: "[]"

            val dateFormat = SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault())
            val logEntry = JSONObject().apply {
                put("sender", sender)
                put("message", if (message.length > 80) message.take(80) + "..." else message)
                put("source", source)
                put("status", status)
                put("time", dateFormat.format(Date()))
            }

            val logsArray = org.json.JSONArray(logs)
            logsArray.put(logEntry)

            // เก็บแค่ 100 logs ล่าสุด
            while (logsArray.length() > 100) {
                logsArray.remove(0)
            }

            prefs.edit().putString("logs", logsArray.toString()).apply()
        } catch (e: Exception) {
            // Ignore log errors
        }
    }

    /**
     * ดึง Logs
     */
    fun getLogs(context: Context): List<LogEntry> {
        val prefs = context.getSharedPreferences("SmsLogs", Context.MODE_PRIVATE)
        val logsJson = prefs.getString("logs", "[]") ?: "[]"

        return try {
            val logsArray = org.json.JSONArray(logsJson)
            val logList = mutableListOf<LogEntry>()

            for (i in logsArray.length() - 1 downTo 0) {
                val obj = logsArray.getJSONObject(i)
                logList.add(LogEntry(
                    sender = obj.optString("sender", ""),
                    message = obj.optString("message", ""),
                    source = obj.optString("source", "sms"),
                    status = obj.optString("status", ""),
                    time = obj.optString("time", "")
                ))
            }
            logList
        } catch (e: Exception) {
            emptyList()
        }
    }

    /**
     * ล้าง Logs
     */
    fun clearLogs(context: Context) {
        val prefs = context.getSharedPreferences("SmsLogs", Context.MODE_PRIVATE)
        prefs.edit().putString("logs", "[]").apply()
    }

    /**
     * Login ไปยัง API
     */
    suspend fun login(
        context: Context,
        username: String,
        password: String
    ): Result<LoginResponse> = withContext(Dispatchers.IO) {
        try {
            val prefs = context.getSharedPreferences("PayGateSMS", Context.MODE_PRIVATE)
            val apiUrl = getApiUrl(context)

            val json = JSONObject().apply {
                put("username", username)
                put("password", password)
            }

            val url = URL("$apiUrl/api/app/login")
            val connection = url.openConnection() as HttpURLConnection

            connection.apply {
                requestMethod = "POST"
                setRequestProperty("Content-Type", "application/json")
                doOutput = true
                connectTimeout = 15000
                readTimeout = 15000
            }

            connection.outputStream.use { os ->
                os.write(json.toString().toByteArray(Charsets.UTF_8))
            }

            val responseCode = connection.responseCode
            val responseBody = if (responseCode in 200..299) {
                connection.inputStream.bufferedReader().readText()
            } else {
                connection.errorStream?.bufferedReader()?.readText() ?: "Unknown error"
            }

            connection.disconnect()

            if (responseCode in 200..299) {
                val response = JSONObject(responseBody)
                if (response.optBoolean("success", false)) {
                    val token = response.optString("token", "")
                    val user = response.optJSONObject("user")
                    
                    // Save token
                    prefs.edit()
                        .putString("auth_token", token)
                        .putString("user_id", user?.optString("id", "") ?: "")
                        .putString("user_name", user?.optString("name", "") ?: "")
                        .remove("secret_key")
                        .putBoolean("is_logged_in", true)
                        .apply()
                    
                    Result.success(LoginResponse(
                        success = true,
                        token = token,
                        userName = user?.optString("name", "") ?: "",
                        message = "เข้าสู่ระบบสำเร็จ"
                    ))
                } else {
                    Result.failure(Exception(response.optString("error", "เข้าสู่ระบบไม่สำเร็จ")))
                }
            } else {
                val errorJson = try { JSONObject(responseBody) } catch (e: Exception) { null }
                val errorMsg = errorJson?.optString("error") ?: "เข้าสู่ระบบไม่สำเร็จ"
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Result.failure(Exception("เกิดข้อผิดพลาด: ${e.message}"))
        }
    }

    /**
     * Logout
     */
    suspend fun logout(context: Context): Result<Boolean> = withContext(Dispatchers.IO) {
        try {
            val prefs = context.getSharedPreferences("PayGateSMS", Context.MODE_PRIVATE)
            val apiUrl = prefs.getString("api_url", "") ?: ""
            val token = prefs.getString("auth_token", "") ?: ""

            if (apiUrl.isNotEmpty() && token.isNotEmpty()) {
                try {
                    val url = URL("$apiUrl/api/app/logout")
                    val connection = url.openConnection() as HttpURLConnection

                    connection.apply {
                        requestMethod = "POST"
                        setRequestProperty("Authorization", "Bearer $token")
                        connectTimeout = 5000
                        readTimeout = 5000
                    }

                    connection.responseCode
                    connection.disconnect()
                } catch (e: Exception) {
                    // Ignore logout API errors
                }
            }

            // Clear local auth data
            prefs.edit()
                .remove("auth_token")
                .remove("user_id")
                .remove("user_name")
                .putBoolean("is_logged_in", false)
                .apply()

            Result.success(true)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    /**
     * Verify token
     */
    suspend fun verifyToken(context: Context): Boolean = withContext(Dispatchers.IO) {
        try {
            val prefs = context.getSharedPreferences("PayGateSMS", Context.MODE_PRIVATE)
            val apiUrl = getApiUrl(context)
            val token = prefs.getString("auth_token", "") ?: ""
            val isLoggedIn = prefs.getBoolean("is_logged_in", false)

            if (!isLoggedIn || token.isEmpty()) {
                return@withContext false
            }

            val url = URL("$apiUrl/api/app/verify")
            val connection = url.openConnection() as HttpURLConnection

            connection.apply {
                requestMethod = "GET"
                setRequestProperty("Authorization", "Bearer $token")
                connectTimeout = 10000
                readTimeout = 10000
            }

            val responseCode = connection.responseCode
            connection.disconnect()

            if (responseCode == 401) {
                // Token invalid, clear auth
                prefs.edit()
                    .remove("auth_token")
                    .remove("user_id")
                    .remove("user_name")
                    .putBoolean("is_logged_in", false)
                    .apply()
                return@withContext false
            }

            responseCode == 200
        } catch (e: Exception) {
            // Network error - keep user logged in
            true
        }
    }

    /**
     * Check if logged in
     */
    fun isLoggedIn(context: Context): Boolean {
        val prefs = context.getSharedPreferences("PayGateSMS", Context.MODE_PRIVATE)
        return prefs.getBoolean("is_logged_in", false) && 
               prefs.getString("auth_token", "")?.isNotEmpty() == true
    }

    /**
     * Get auth token
     */
    fun getAuthToken(context: Context): String? {
        val prefs = context.getSharedPreferences("PayGateSMS", Context.MODE_PRIVATE)
        return prefs.getString("auth_token", null)
    }

    /**
     * Get user name
     */
    fun getUserName(context: Context): String {
        val prefs = context.getSharedPreferences("PayGateSMS", Context.MODE_PRIVATE)
        return prefs.getString("user_name", "") ?: ""
    }
}

data class ApiResponse(
    val success: Boolean,
    val matched: Boolean,
    val transactionId: String?,
    val message: String
)

data class LogEntry(
    val sender: String,
    val message: String,
    val source: String,
    val status: String,
    val time: String
)

data class LoginResponse(
    val success: Boolean,
    val token: String,
    val userName: String,
    val message: String
)
