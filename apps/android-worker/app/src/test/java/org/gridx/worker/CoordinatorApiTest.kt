package org.gridx.worker
import okhttp3.mockwebserver.*
import org.junit.Assert.*
import org.junit.Test

class CoordinatorApiTest {
    @Test fun neverFollowsCredentialRedirects() {
        val destination=MockWebServer();val source=MockWebServer()
        source.enqueue(MockResponse().setResponseCode(307).addHeader("Location",destination.url("/stolen")))
        try {
            assertThrows(IllegalArgumentException::class.java){CoordinatorApi(source.url("/").toString().trimEnd('/')).leave("private-test-token")}
            assertEquals(0,destination.requestCount)
        }finally{source.shutdown();destination.shutdown()}
    }
    @Test fun leaveAcknowledgesRevokedIdentityButNotServerFailure() {
        val server=MockWebServer();server.enqueue(MockResponse().setResponseCode(401));server.enqueue(MockResponse().setResponseCode(503))
        try {
            val api=CoordinatorApi(server.url("/").toString().trimEnd('/'))
            api.leave("test-token")
            assertThrows(IllegalArgumentException::class.java){api.leave("test-token")}
        }finally{server.shutdown()}
    }
}
