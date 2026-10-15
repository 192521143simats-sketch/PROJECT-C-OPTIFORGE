package org.gridx.worker
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import org.junit.Rule
import org.junit.Test

class NativeUiTest {
    @get:Rule val compose=createAndroidComposeRule<MainActivity>()
    @Test fun initialScreenRequiresInspectionAndExplicitConsent() {
        compose.onNodeWithText("GRID-X Worker").assertIsDisplayed()
        compose.onNodeWithText("Become a Worker").assertIsNotEnabled()
    }
}
