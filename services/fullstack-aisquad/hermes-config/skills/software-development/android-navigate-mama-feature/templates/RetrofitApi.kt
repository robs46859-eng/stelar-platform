package com.navigatemama.core.data.network

import com.navigatemama.core.data.network.dto.ChatResponse
import com.navigatemama.core.data.network.dto.XXDto
import com.navigatemama.core.data.network.dto.XXResponse
import okhttp3.ResponseBody
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query
import retrofit2.http.Streaming

/**
 * Retrofit API for the Family Companion backend.
 * Base URL: http://10.0.2.2:8000/api/v1/android/  (Android emulator → host)
 *
 * IMPORTANT: Chat endpoints use @Query parameters, NOT @Body.
 * See backend/android.py route signatures for the source of truth.
 */
interface FamilyCompanionApi {

    // ── AI Chat (QUERY params) ─────────────────────────────────

    @POST("chat")
    suspend fun chat(
        @Query("message") message: String,
        @Query("family_id") familyId: String,
        @Query("person_id") personId: String? = null,
        @Query("tone") tone: String = "warm"
    ): ChatResponse

    @POST("chat/stream")
    @Streaming
    suspend fun chatStream(
        @Query("message") message: String,
        @Query("family_id") familyId: String,
        @Query("person_id") personId: String? = null,
        @Query("tone") tone: String = "warm"
    ): Response<ResponseBody>

    // ── Standard GET with Query params ─────────────────────────

    @GET("xxx")
    suspend fun getXxx(
        @Query("family_id") familyId: String,
        @Query("person_id") personId: String? = null
    ): XXResponse

    // ── Standard POST with JSON body ───────────────────────────

    @POST("xxx")
    suspend fun createXxx(
        @Body body: XXDto
    ): XXResponse

    // ── GET with path param + Query ────────────────────────────

    @GET("xxx/{id}")
    suspend fun getXxxById(
        @Path("id") id: String,
        @Query("person_id") personId: String
    ): List<XXResponse>
}
