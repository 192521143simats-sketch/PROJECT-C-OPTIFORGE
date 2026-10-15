package org.gridx.worker

import android.content.res.Configuration
import androidx.activity.compose.setContent
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.luminance
import androidx.compose.ui.graphics.toPixelMap
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

class ThemeDeviceTest {
    @get:Rule val compose=createAndroidComposeRule<MainActivity>()
    @Test fun actualScreenFollowsDeviceThemeAndShowsControls() {
        compose.onNodeWithText("GRID-X Worker").assertIsDisplayed()
        compose.onNodeWithText("Inspect network").assertIsDisplayed()
        val dark=(compose.activity.resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK)==Configuration.UI_MODE_NIGHT_YES
        val pixels=compose.onRoot().captureToImage().toPixelMap()
        val background=pixels[2,2].luminance()
        assertTrue("Rendered background must follow Android night mode",if(dark) background<0.1f else background>0.8f)
    }
    @Test fun lightConfigurationRendersReadableLightPaletteOnPhysicalDevice() {
        // Xiaomi may lock global night mode. Override only this test composition,
        // never the user's system setting, to exercise our automatic theme boundary.
        val configuration=Configuration(compose.activity.resources.configuration)
        configuration.uiMode=(configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK.inv()) or Configuration.UI_MODE_NIGHT_NO
        compose.runOnUiThread {
            compose.activity.setContent {
                CompositionLocalProvider(LocalConfiguration provides configuration) {
                    WorkerTheme { Surface(Modifier.fillMaxSize()) {Text("Light theme verification")} }
                }
            }
        }
        compose.onNodeWithText("Light theme verification").assertIsDisplayed()
        val pixels=compose.onRoot().captureToImage().toPixelMap()
        assertTrue("Light configuration must render a light surface",pixels[2,pixels.height-3].luminance()>0.8f)
    }
}
