package com.paygate.smsforwarder

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Bundle
import android.provider.Settings
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import androidx.compose.ui.draw.blur
import com.paygate.smsforwarder.ui.theme.HyronpaySmsForwarderTheme
import kotlinx.coroutines.launch
import androidx.compose.ui.res.stringResource
import androidx.compose.runtime.DisposableEffect
import androidx.compose.ui.platform.LocalLifecycleOwner


class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        setContent {
            HyronpaySmsForwarderTheme {
                HyronpayApp(
                    onStartService = { startForwarderService() }
                )
            }
        }
    }

    private fun startForwarderService() {
        val intent = Intent(this, SmsForwarderService::class.java)
        startForegroundService(intent)
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PayGateApp(
    onStartService: () -> Unit = {}
) {
    HyronpayApp(onStartService = onStartService)
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HyronpayApp(
    onStartService: () -> Unit = {}
) {
    val context = LocalContext.current
    val prefs = context.getSharedPreferences("PayGateSMS", Context.MODE_PRIVATE)
    val scope = rememberCoroutineScope()
    val lifecycleOwner = LocalLifecycleOwner.current

    // Permission states
    var smsPermissionGranted by remember { mutableStateOf(false) }
    var notificationListenerEnabled by remember { mutableStateOf(false) }
    var permissionsChecked by remember { mutableStateOf(false) }

    // Permission launcher
    val permissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        smsPermissionGranted = permissions.all { it.value }
        if (smsPermissionGranted) {
            Toast.makeText(context, context.getString(R.string.toast_sms_granted), Toast.LENGTH_SHORT).show()
        }
    }

    // Check permissions on resume
    DisposableEffect(lifecycleOwner) {
        val observer = androidx.lifecycle.LifecycleEventObserver { _, event ->
            if (event == androidx.lifecycle.Lifecycle.Event.ON_RESUME) {
                smsPermissionGranted = ContextCompat.checkSelfPermission(
                    context, Manifest.permission.RECEIVE_SMS
                ) == PackageManager.PERMISSION_GRANTED &&
                ContextCompat.checkSelfPermission(
                    context, Manifest.permission.READ_SMS
                ) == PackageManager.PERMISSION_GRANTED
                
                notificationListenerEnabled = NotificationListener.isEnabled(context)
                permissionsChecked = true
            }
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        
        // Initial check
        smsPermissionGranted = ContextCompat.checkSelfPermission(
            context, Manifest.permission.RECEIVE_SMS
        ) == PackageManager.PERMISSION_GRANTED &&
        ContextCompat.checkSelfPermission(
            context, Manifest.permission.READ_SMS
        ) == PackageManager.PERMISSION_GRANTED
        notificationListenerEnabled = NotificationListener.isEnabled(context)
        permissionsChecked = true

        onDispose {
            lifecycleOwner.lifecycle.removeObserver(observer)
        }
    }

    // Show permission screen if permissions not granted
    if (!smsPermissionGranted || !notificationListenerEnabled) {
        PermissionScreen(
            smsGranted = smsPermissionGranted,
            notificationGranted = notificationListenerEnabled,
            onRequestSmsPermission = {
                permissionLauncher.launch(arrayOf(
                    Manifest.permission.RECEIVE_SMS,
                    Manifest.permission.READ_SMS
                ))
            },
            onRequestNotificationPermission = {
                val intent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS)
                context.startActivity(intent)
            }
        )
        return
    }

    // Start service after permissions granted
    LaunchedEffect(smsPermissionGranted, notificationListenerEnabled) {
        if (smsPermissionGranted && notificationListenerEnabled) {
            onStartService()
        }
    }

    // Auth state
    var isLoggedIn by remember { mutableStateOf(ApiHelper.isLoggedIn(context)) }
    var isCheckingAuth by remember { mutableStateOf(true) }
    var userName by remember { mutableStateOf(ApiHelper.getUserName(context)) }

    // Check auth on resume
    LaunchedEffect(Unit) {
        isCheckingAuth = true
        val isValid = ApiHelper.verifyToken(context)
        isLoggedIn = isValid
        if (isValid) {
            userName = ApiHelper.getUserName(context)
        }
        isCheckingAuth = false
    }

    // Show loading while checking auth
    if (isCheckingAuth) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(com.paygate.smsforwarder.ui.theme.BackgroundDark),
            contentAlignment = Alignment.Center
        ) {
            CircularProgressIndicator(color = com.paygate.smsforwarder.ui.theme.NeonCyan)
        }
        return
    }

    // Show login screen if not logged in
    if (!isLoggedIn) {
        LoginScreen(
            onLoginSuccess = {
                isLoggedIn = true
                userName = ApiHelper.getUserName(context)
            }
        )
        return
    }

    // Main app content
    val prefs2 = context.getSharedPreferences("PayGateSMS", Context.MODE_PRIVATE)

    // States - use default API URL if not configured
    val savedApiUrl = prefs2.getString("api_url", "") ?: ""
    var apiUrl by remember { mutableStateOf(if (savedApiUrl.isEmpty()) ApiHelper.DEFAULT_API_URL else savedApiUrl) }
    var isEnabled by remember { mutableStateOf(prefs2.getBoolean("enabled", true)) }
    var smsEnabled by remember { mutableStateOf(prefs2.getBoolean("sms_enabled", true)) }
    var notificationEnabled by remember { mutableStateOf(prefs2.getBoolean("notification_enabled", true)) }
    var connectionStatus by remember { mutableStateOf<ConnectionStatus>(ConnectionStatus.Unknown) }
    var showLogs by remember { mutableStateOf(false) }
    var logs by remember { mutableStateOf(listOf<LogEntry>()) }
    var showLogoutDialog by remember { mutableStateOf(false) }

    // Load logs
    LaunchedEffect(showLogs) {
        if (showLogs) {
            logs = ApiHelper.getLogs(context)
        }
    }

    // Logout confirmation dialog
    if (showLogoutDialog) {
        AlertDialog(
            onDismissRequest = { showLogoutDialog = false },
            title = { Text(stringResource(R.string.btn_logout), color = Color.White) },
            text = { Text("ต้องการออกจากระบบหรือไม่?", color = com.paygate.smsforwarder.ui.theme.TextSecondary) },
            confirmButton = {
                TextButton(
                    onClick = {
                        scope.launch {
                            ApiHelper.logout(context)
                            isLoggedIn = false
                        }
                        showLogoutDialog = false
                    }
                ) {
                    Text("ออกจากระบบ", color = com.paygate.smsforwarder.ui.theme.ErrorGradientEnd)
                }
            },
            dismissButton = {
                TextButton(onClick = { showLogoutDialog = false }) {
                    Text("ยกเลิก", color = com.paygate.smsforwarder.ui.theme.TextSecondary)
                }
            },
            containerColor = com.paygate.smsforwarder.ui.theme.SurfaceLighter
        )
    }

    Scaffold(
        containerColor = com.paygate.smsforwarder.ui.theme.BackgroundDark
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState())
                .padding(24.dp)
        ) {
            // Header with logout button
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.fillMaxWidth()
            ) {
                Box(
                    modifier = Modifier
                        .size(42.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(
                            Brush.linearGradient(
                                colors = listOf(com.paygate.smsforwarder.ui.theme.BrandGradientStart, com.paygate.smsforwarder.ui.theme.BrandGradientEnd)
                            )
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        Icons.Default.Notifications,
                        contentDescription = null,
                        tint = Color.White,
                        modifier = Modifier.size(24.dp)
                    )
                }
                Spacer(Modifier.width(16.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text(stringResource(R.string.app_name), fontWeight = FontWeight.Bold, fontSize = 20.sp, color = Color.White)
                    Text(stringResource(R.string.app_name_subtitle), fontSize = 14.sp, color = com.paygate.smsforwarder.ui.theme.TextSecondary)
                }
                
                // Logout button
                IconButton(
                    onClick = { showLogoutDialog = true },
                    modifier = Modifier
                        .size(40.dp)
                        .clip(RoundedCornerShape(10.dp))
                        .background(com.paygate.smsforwarder.ui.theme.SurfaceLighter.copy(alpha = 0.5f))
                ) {
                    Icon(
                        Icons.Default.Logout,
                        contentDescription = stringResource(R.string.btn_logout),
                        tint = com.paygate.smsforwarder.ui.theme.TextSecondary,
                        modifier = Modifier.size(20.dp)
                    )
                }
            }

            Spacer(Modifier.height(32.dp))

            // Active Status Card (Glowing Gradient)
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(140.dp),
                shape = RoundedCornerShape(24.dp),
                elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
                colors = CardDefaults.cardColors(containerColor = Color.Transparent)
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(
                            Brush.linearGradient(
                                colors = if (isEnabled) 
                                    listOf(com.paygate.smsforwarder.ui.theme.SecondaryGradientStart, com.paygate.smsforwarder.ui.theme.SecondaryGradientEnd)
                                else 
                                    listOf(com.paygate.smsforwarder.ui.theme.ErrorGradientStart, com.paygate.smsforwarder.ui.theme.ErrorGradientEnd)
                            )
                        )
                ) {
                    // Glow effect overlay
                    Box(
                         modifier = Modifier
                             .align(Alignment.TopEnd)
                             .offset(x = 20.dp, y = (-20).dp)
                             .size(100.dp)
                             .clip(CircleShape)
                             .background(Color.White.copy(alpha = 0.2f))
                             .blur(40.dp)
                    )

                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(24.dp),
                        verticalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.Top,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text(
                                if (isEnabled) stringResource(R.string.status_active) else stringResource(R.string.status_inactive),
                                fontWeight = FontWeight.Black,
                                fontSize = 28.sp,
                                color = Color.White,
                                letterSpacing = 1.sp
                            )
                            Switch(
                                checked = isEnabled,
                                onCheckedChange = {
                                    isEnabled = it
                                    prefs.edit().putBoolean("enabled", it).apply()
                                },
                                colors = SwitchDefaults.colors(
                                    checkedThumbColor = com.paygate.smsforwarder.ui.theme.SecondaryGradientEnd,
                                    checkedTrackColor = Color.White,
                                    uncheckedThumbColor = Color.White,
                                    uncheckedTrackColor = Color.White.copy(alpha = 0.3f)
                                )
                            )
                        }
                        
                        Row(verticalAlignment = Alignment.CenterVertically) {
                           Icon(
                                if (isEnabled) Icons.Default.CheckCircle else Icons.Default.Error,
                                contentDescription = null,
                                tint = Color.White,
                                modifier = Modifier.size(20.dp)
                           )
                           Spacer(Modifier.width(8.dp))
                           Text(
                                if (isEnabled) stringResource(R.string.status_forwarding_on) else stringResource(R.string.status_system_off),
                                color = Color.White.copy(alpha = 0.9f),
                                fontWeight = FontWeight.Medium
                           )
                        }
                    }
                }
            }

            Spacer(Modifier.height(32.dp))

            // Source Settings
            Text(
                stringResource(R.string.section_source),
                fontWeight = FontWeight.Bold,
                fontSize = 12.sp,
                color = com.paygate.smsforwarder.ui.theme.TextSecondary,
                letterSpacing = 1.sp
            )
            Spacer(Modifier.height(12.dp))

            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = com.paygate.smsforwarder.ui.theme.SurfaceLighter.copy(alpha = 0.5f)),
                shape = RoundedCornerShape(16.dp)
            ) {
                Column(modifier = Modifier.padding(8.dp)) {
                    SourceToggleItem(
                        title = stringResource(R.string.source_sms_title),
                        subtitle = stringResource(R.string.source_sms_subtitle),
                        icon = Icons.Default.Sms,
                        checked = smsEnabled,
                        onCheckedChange = {
                            smsEnabled = it
                            prefs.edit().putBoolean("sms_enabled", it).apply()
                        },
                        color = com.paygate.smsforwarder.ui.theme.BrandGradientStart,
                        onClick = {
                            smsEnabled = !smsEnabled
                            prefs.edit().putBoolean("sms_enabled", smsEnabled).apply()
                        }
                    )
                    Divider(color = com.paygate.smsforwarder.ui.theme.BackgroundDark.copy(alpha = 0.5f))
                    SourceToggleItem(
                        title = stringResource(R.string.source_notification_title),
                        subtitle = if (notificationListenerEnabled) stringResource(R.string.source_notification_enabled) else stringResource(R.string.source_notification_permission_required),
                        icon = Icons.Default.Notifications,
                        checked = notificationEnabled,
                        onCheckedChange = {
                           if (notificationListenerEnabled) {
                               notificationEnabled = it
                               prefs.edit().putBoolean("notification_enabled", it).apply()
                           }
                        },
                        color = com.paygate.smsforwarder.ui.theme.NeonPurple,
                        enabled = notificationListenerEnabled,
                        showPermissionWarning = !notificationListenerEnabled,
                        onClick = {
                            if (!notificationListenerEnabled) {
                                NotificationListener.openSettings(context)
                            } else {
                                notificationEnabled = !notificationEnabled
                                prefs.edit().putBoolean("notification_enabled", notificationEnabled).apply()
                            }
                        }
                    )
                }
            }
            
            Spacer(Modifier.height(32.dp))

            // API Settings
            Text(
                stringResource(R.string.section_api_settings),
                fontWeight = FontWeight.Bold,
                fontSize = 12.sp,
                color = com.paygate.smsforwarder.ui.theme.TextSecondary,
                letterSpacing = 1.sp
            )
            Spacer(Modifier.height(12.dp))
            
            Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                ModernTextField(
                    value = apiUrl,
                    onValueChange = {
                        apiUrl = it
                        prefs.edit().putString("api_url", it).apply()
                        connectionStatus = ConnectionStatus.Unknown
                    },
                    label = stringResource(R.string.label_api_url),
                    placeholder = stringResource(R.string.placeholder_api_url),
                    icon = Icons.Default.Link
                )

                Button(
                    onClick = {
                        scope.launch {
                            connectionStatus = ConnectionStatus.Testing
                            // Use context-based testConnection (uses JWT token if logged in)
                            val success = ApiHelper.testConnection(context)
                            connectionStatus = if (success) ConnectionStatus.Success else ConnectionStatus.Failed
                        }
                    },
                    modifier = Modifier.fillMaxWidth().height(56.dp),
                    shape = RoundedCornerShape(16.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Color.Transparent
                    ),
                    contentPadding = PaddingValues()
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .background(
                                Brush.linearGradient(
                                    colors = when (connectionStatus) {
                                        ConnectionStatus.Success -> listOf(com.paygate.smsforwarder.ui.theme.SecondaryGradientStart, com.paygate.smsforwarder.ui.theme.SecondaryGradientEnd)
                                        ConnectionStatus.Failed -> listOf(com.paygate.smsforwarder.ui.theme.ErrorGradientStart, com.paygate.smsforwarder.ui.theme.ErrorGradientEnd)
                                        else -> listOf(com.paygate.smsforwarder.ui.theme.BrandGradientStart, com.paygate.smsforwarder.ui.theme.BrandGradientEnd)
                                    }
                                )
                            ),
                        contentAlignment = Alignment.Center
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                           if (connectionStatus == ConnectionStatus.Testing) {
                               CircularProgressIndicator(color = Color.White, modifier = Modifier.size(20.dp), strokeWidth = 2.dp)
                               Spacer(Modifier.width(12.dp))
                           }
                           Icon(
                               imageVector = when(connectionStatus) {
                                   ConnectionStatus.Success -> Icons.Default.Check
                                   ConnectionStatus.Failed -> Icons.Default.Close
                                   else -> Icons.Default.Wifi
                               },
                               contentDescription = null,
                               tint = Color.White
                           )
                           Spacer(Modifier.width(8.dp))
                           Text(
                               text = when(connectionStatus) {
                                   ConnectionStatus.Testing -> stringResource(R.string.status_connecting)
                                   ConnectionStatus.Success -> stringResource(R.string.status_connected)
                                   ConnectionStatus.Failed -> stringResource(R.string.status_connection_failed)
                                   else -> stringResource(R.string.btn_test_connection)
                               },
                               fontWeight = FontWeight.Bold,
                               color = Color.White
                           )
                        }
                    }
                }
            }
            
            Spacer(Modifier.height(32.dp))
            
            // Recent Logs
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                 Text(
                    stringResource(R.string.section_recent_logs),
                    fontWeight = FontWeight.Bold,
                    fontSize = 12.sp,
                    color = com.paygate.smsforwarder.ui.theme.TextSecondary,
                    letterSpacing = 1.sp
                )
                Row {
                    if (showLogs && logs.isNotEmpty()) {
                        TextButton(onClick = {
                            ApiHelper.clearLogs(context)
                            logs = emptyList()
                        }) {
                            Text(stringResource(R.string.btn_clear), color = com.paygate.smsforwarder.ui.theme.ErrorGradientEnd, fontSize = 12.sp)
                        }
                    }
                    TextButton(onClick = { 
                        showLogs = !showLogs 
                    }) {
                        Text(
                            if (showLogs) stringResource(R.string.btn_hide) else "${stringResource(R.string.btn_show)} ${if (logs.isNotEmpty()) "(${logs.size})" else ""}",
                            color = com.paygate.smsforwarder.ui.theme.NeonCyan
                        )
                    }
                }
            }
            
            if (showLogs) {
                Spacer(Modifier.height(12.dp))
                if (logs.isEmpty()) {
                    Text(
                        stringResource(R.string.no_recent_activity),
                        color = com.paygate.smsforwarder.ui.theme.TextSecondary,
                        modifier = Modifier.padding(16.dp),
                        fontStyle = androidx.compose.ui.text.font.FontStyle.Italic
                    )
                } else {
                    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        logs.take(20).forEach { log ->
                            LogItem(log)
                        }
                    }
                }
            }
            
            Spacer(Modifier.height(48.dp))
        }
    }
}

@Composable
fun SourceToggleItem(
    title: String,
    subtitle: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit,
    color: Color,
    enabled: Boolean = true,
    showPermissionWarning: Boolean = false,
    onClick: () -> Unit = {}
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() }
            .padding(16.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .clip(CircleShape)
                    .background(color.copy(alpha = 0.1f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(icon, null, tint = color)
            }
            Spacer(Modifier.width(16.dp))
            Column {
                Text(title, fontWeight = FontWeight.Bold, color = Color.White)
                if (showPermissionWarning) {
                    Text(stringResource(R.string.tap_to_grant_permission), fontSize = 12.sp, color = com.paygate.smsforwarder.ui.theme.ErrorGradientEnd)
                } else {
                    Text(subtitle, fontSize = 12.sp, color = com.paygate.smsforwarder.ui.theme.TextSecondary)
                }
            }
        }
        Switch(
            checked = checked,
            onCheckedChange = { onCheckedChange(it) }, 
            enabled = enabled,
            colors = SwitchDefaults.colors(
                checkedThumbColor = color,
                checkedTrackColor = com.paygate.smsforwarder.ui.theme.BackgroundDark,
                uncheckedThumbColor = com.paygate.smsforwarder.ui.theme.TextSecondary,
                uncheckedTrackColor = com.paygate.smsforwarder.ui.theme.BackgroundDark
            )
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ModernTextField(
    value: String,
    onValueChange: (String) -> Unit,
    label: String,
    placeholder: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    isPassword: Boolean = false
) {
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        label = { Text(label) },
        placeholder = { Text(placeholder, color = com.paygate.smsforwarder.ui.theme.TextSecondary.copy(alpha=0.5f)) },
        leadingIcon = { Icon(icon, null, tint = com.paygate.smsforwarder.ui.theme.NeonCyan) },
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = OutlinedTextFieldDefaults.colors(
            focusedBorderColor = com.paygate.smsforwarder.ui.theme.NeonCyan,
            unfocusedBorderColor = com.paygate.smsforwarder.ui.theme.InputBorder,
            focusedLabelColor = com.paygate.smsforwarder.ui.theme.NeonCyan,
            unfocusedLabelColor = com.paygate.smsforwarder.ui.theme.TextSecondary,
            focusedTextColor = Color.White,
            unfocusedTextColor = Color.White,
            cursorColor = com.paygate.smsforwarder.ui.theme.NeonCyan,
            focusedContainerColor = com.paygate.smsforwarder.ui.theme.SurfaceLighter.copy(alpha=0.3f),
            unfocusedContainerColor = com.paygate.smsforwarder.ui.theme.SurfaceLighter.copy(alpha=0.1f)
        ),
        visualTransformation = if (isPassword) androidx.compose.ui.text.input.PasswordVisualTransformation() else androidx.compose.ui.text.input.VisualTransformation.None,
        singleLine = true
    )
}

@Composable
fun LogItem(log: LogEntry) {
    val isSuccess = log.status.startsWith("SUCCESS")
    
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = com.paygate.smsforwarder.ui.theme.SurfaceLighter.copy(alpha = 0.3f))
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(8.dp)
                    .clip(CircleShape)
                    .background(if (isSuccess) com.paygate.smsforwarder.ui.theme.SecondaryGradientEnd else com.paygate.smsforwarder.ui.theme.ErrorGradientEnd)
            )
            Spacer(Modifier.width(16.dp))
            Column(modifier = Modifier.weight(1f)) {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                     Text(
                        log.sender,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                    Text(
                        log.time.split("T").last().substring(0,5),
                        fontSize = 12.sp,
                        color = com.paygate.smsforwarder.ui.theme.TextSecondary
                    )
                }
                
                Spacer(Modifier.height(4.dp))
                Text(
                    log.message,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    fontSize = 13.sp,
                    color = com.paygate.smsforwarder.ui.theme.TextSecondary
                )
                
                if (log.status == "IGNORED (Unknown App)") {
                    Spacer(Modifier.height(4.dp))
                    Text(
                        stringResource(R.string.log_ignored_unknown),
                        fontSize = 11.sp,
                        color = com.paygate.smsforwarder.ui.theme.ErrorGradientEnd
                    )
                }
            }
        }
    }
}

enum class ConnectionStatus {
    Unknown, Testing, Success, Failed
}

/**
 * หน้าจอบังคับขอสิทธิ์ก่อนใช้งานแอป
 */
@Composable
fun PermissionScreen(
    smsGranted: Boolean,
    notificationGranted: Boolean,
    onRequestSmsPermission: () -> Unit,
    onRequestNotificationPermission: () -> Unit
) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(com.paygate.smsforwarder.ui.theme.BackgroundDark)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            // Header
            Box(
                modifier = Modifier
                    .size(80.dp)
                    .clip(RoundedCornerShape(20.dp))
                    .background(
                        Brush.linearGradient(
                            colors = listOf(
                                com.paygate.smsforwarder.ui.theme.BrandGradientStart,
                                com.paygate.smsforwarder.ui.theme.BrandGradientEnd
                            )
                        )
                    ),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    Icons.Default.Security,
                    contentDescription = null,
                    tint = Color.White,
                    modifier = Modifier.size(44.dp)
                )
            }
            
            Spacer(Modifier.height(24.dp))
            
            Text(
                "ต้องการสิทธิ์การเข้าถึง",
                fontWeight = FontWeight.Bold,
                fontSize = 24.sp,
                color = Color.White
            )
            
            Text(
                "กรุณาเปิดสิทธิ์เพื่อให้แอปทำงานได้อย่างถูกต้อง",
                fontSize = 14.sp,
                color = com.paygate.smsforwarder.ui.theme.TextSecondary,
                textAlign = TextAlign.Center,
                modifier = Modifier.padding(horizontal = 24.dp)
            )
            
            Spacer(Modifier.height(40.dp))
            
            // SMS Permission Card
            PermissionCard(
                title = "สิทธิ์รับ SMS",
                description = "จำเป็นสำหรับดักจับ SMS จากธนาคาร",
                icon = Icons.Default.Sms,
                isGranted = smsGranted,
                onClick = onRequestSmsPermission
            )
            
            Spacer(Modifier.height(16.dp))
            
            // Notification Permission Card
            PermissionCard(
                title = "สิทธิ์อ่านการแจ้งเตือน",
                description = "จำเป็นสำหรับดักจับ Push Notifications",
                icon = Icons.Default.Notifications,
                isGranted = notificationGranted,
                onClick = onRequestNotificationPermission
            )
            
            Spacer(Modifier.height(32.dp))
            
            // Info text
            if (!smsGranted || !notificationGranted) {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(
                        containerColor = com.paygate.smsforwarder.ui.theme.SurfaceLighter.copy(alpha = 0.3f)
                    ),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            Icons.Default.Info,
                            contentDescription = null,
                            tint = com.paygate.smsforwarder.ui.theme.NeonCyan,
                            modifier = Modifier.size(20.dp)
                        )
                        Spacer(Modifier.width(12.dp))
                        Text(
                            "กรุณาเปิดสิทธิ์ทั้งหมดเพื่อใช้งานแอป",
                            color = com.paygate.smsforwarder.ui.theme.TextSecondary,
                            fontSize = 13.sp
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun PermissionCard(
    title: String,
    description: String,
    icon: ImageVector,
    isGranted: Boolean,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(enabled = !isGranted) { onClick() },
        colors = CardDefaults.cardColors(
            containerColor = if (isGranted) 
                com.paygate.smsforwarder.ui.theme.SuccessGradientStart.copy(alpha = 0.15f)
            else 
                com.paygate.smsforwarder.ui.theme.SurfaceLighter
        ),
        shape = RoundedCornerShape(16.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(20.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(48.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(
                        if (isGranted)
                            com.paygate.smsforwarder.ui.theme.SuccessGradientStart.copy(alpha = 0.3f)
                        else
                            com.paygate.smsforwarder.ui.theme.NeonCyan.copy(alpha = 0.2f)
                    ),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    icon,
                    contentDescription = null,
                    tint = if (isGranted) 
                        com.paygate.smsforwarder.ui.theme.SuccessGradientEnd
                    else 
                        com.paygate.smsforwarder.ui.theme.NeonCyan,
                    modifier = Modifier.size(24.dp)
                )
            }
            
            Spacer(Modifier.width(16.dp))
            
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    title,
                    fontWeight = FontWeight.SemiBold,
                    fontSize = 16.sp,
                    color = Color.White
                )
                Text(
                    description,
                    fontSize = 13.sp,
                    color = com.paygate.smsforwarder.ui.theme.TextSecondary
                )
            }
            
            Spacer(Modifier.width(12.dp))
            
            if (isGranted) {
                Icon(
                    Icons.Default.CheckCircle,
                    contentDescription = null,
                    tint = com.paygate.smsforwarder.ui.theme.SuccessGradientEnd,
                    modifier = Modifier.size(28.dp)
                )
            } else {
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(8.dp))
                        .background(com.paygate.smsforwarder.ui.theme.NeonCyan)
                        .padding(horizontal = 12.dp, vertical = 6.dp)
                ) {
                    Text(
                        "เปิดสิทธิ์",
                        fontWeight = FontWeight.Medium,
                        fontSize = 12.sp,
                        color = Color.Black
                    )
                }
            }
        }
    }
}
