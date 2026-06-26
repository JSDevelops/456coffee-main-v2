package com.paygate.smsforwarder

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LoginScreen(
    onLoginSuccess: () -> Unit
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    
    var username by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var showPassword by remember { mutableStateOf(false) }
    var isLoading by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }

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
                    .size(72.dp)
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
                    Icons.Default.Notifications,
                    contentDescription = null,
                    tint = Color.White,
                    modifier = Modifier.size(40.dp)
                )
            }
            
            Spacer(Modifier.height(24.dp))
            
            Text(
                stringResource(R.string.app_name),
                fontWeight = FontWeight.Bold,
                fontSize = 24.sp,
                color = Color.White
            )
            
            Text(
                stringResource(R.string.login_subtitle),
                fontSize = 14.sp,
                color = com.paygate.smsforwarder.ui.theme.TextSecondary
            )
            
            Spacer(Modifier.height(48.dp))
            
            // Error message
            errorMessage?.let { error ->
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(
                        containerColor = com.paygate.smsforwarder.ui.theme.ErrorGradientStart.copy(alpha = 0.2f)
                    ),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            Icons.Default.Error,
                            contentDescription = null,
                            tint = com.paygate.smsforwarder.ui.theme.ErrorGradientEnd,
                            modifier = Modifier.size(20.dp)
                        )
                        Spacer(Modifier.width(12.dp))
                        Text(
                            error,
                            color = com.paygate.smsforwarder.ui.theme.ErrorGradientEnd,
                            fontSize = 14.sp
                        )
                    }
                }
                Spacer(Modifier.height(16.dp))
            }
            
            // Username field
            OutlinedTextField(
                value = username,
                onValueChange = { 
                    username = it
                    errorMessage = null
                },
                label = { Text(stringResource(R.string.label_username)) },
                leadingIcon = {
                    Icon(
                        Icons.Default.Person,
                        null,
                        tint = com.paygate.smsforwarder.ui.theme.NeonCyan
                    )
                },
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
                    focusedContainerColor = com.paygate.smsforwarder.ui.theme.SurfaceLighter.copy(alpha = 0.3f),
                    unfocusedContainerColor = com.paygate.smsforwarder.ui.theme.SurfaceLighter.copy(alpha = 0.1f)
                ),
                singleLine = true,
                enabled = !isLoading
            )
            
            Spacer(Modifier.height(16.dp))
            
            // Password field
            OutlinedTextField(
                value = password,
                onValueChange = { 
                    password = it
                    errorMessage = null
                },
                label = { Text(stringResource(R.string.label_password)) },
                leadingIcon = {
                    Icon(
                        Icons.Default.Lock,
                        null,
                        tint = com.paygate.smsforwarder.ui.theme.NeonCyan
                    )
                },
                trailingIcon = {
                    IconButton(onClick = { showPassword = !showPassword }) {
                        Icon(
                            if (showPassword) Icons.Default.VisibilityOff else Icons.Default.Visibility,
                            null,
                            tint = com.paygate.smsforwarder.ui.theme.TextSecondary
                        )
                    }
                },
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
                    focusedContainerColor = com.paygate.smsforwarder.ui.theme.SurfaceLighter.copy(alpha = 0.3f),
                    unfocusedContainerColor = com.paygate.smsforwarder.ui.theme.SurfaceLighter.copy(alpha = 0.1f)
                ),
                visualTransformation = if (showPassword) VisualTransformation.None else PasswordVisualTransformation(),
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                singleLine = true,
                enabled = !isLoading
            )
            
            Spacer(Modifier.height(32.dp))
            
            // Login button
            Button(
                onClick = {
                    if (username.isBlank() || password.isBlank()) {
                        errorMessage = context.getString(R.string.login_failed)
                        return@Button
                    }
                    
                    scope.launch {
                        isLoading = true
                        errorMessage = null
                        
                        val result = ApiHelper.login(context, username.trim(), password)
                        
                        result.fold(
                            onSuccess = {
                                onLoginSuccess()
                            },
                            onFailure = { error ->
                                errorMessage = error.message ?: context.getString(R.string.login_failed)
                            }
                        )
                        
                        isLoading = false
                    }
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(56.dp),
                shape = RoundedCornerShape(16.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent),
                contentPadding = PaddingValues(),
                enabled = !isLoading
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
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
                    if (isLoading) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            CircularProgressIndicator(
                                color = Color.White,
                                modifier = Modifier.size(20.dp),
                                strokeWidth = 2.dp
                            )
                            Spacer(Modifier.width(12.dp))
                            Text(
                                stringResource(R.string.logging_in),
                                fontWeight = FontWeight.Bold,
                                color = Color.White
                            )
                        }
                    } else {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                Icons.Default.Login,
                                contentDescription = null,
                                tint = Color.White
                            )
                            Spacer(Modifier.width(8.dp))
                            Text(
                                stringResource(R.string.btn_login),
                                fontWeight = FontWeight.Bold,
                                color = Color.White
                            )
                        }
                    }
                }
            }
        }
    }
}
