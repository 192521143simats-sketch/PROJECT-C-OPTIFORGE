package org.gridx.worker

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

// Paired Material palettes, not bitmap/color inversion. Re-evaluates on OS theme changes.
internal fun workerColorScheme(dark: Boolean) =
    if (dark) darkColorScheme(onBackground=Color(0xFFF5F5F5),onSurface=Color(0xFFF5F5F5)) else lightColorScheme()

@Composable
fun WorkerTheme(content: @Composable () -> Unit) {
    MaterialTheme(colorScheme=workerColorScheme(isSystemInDarkTheme()),content=content)
}
