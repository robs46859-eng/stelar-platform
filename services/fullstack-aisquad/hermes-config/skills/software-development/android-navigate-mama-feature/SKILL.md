---
name: android-navigate-mama-feature
description: Add new features to the Navigate Mama / Family Companion Android app — DTOs, Retrofit API, Repository, ViewModel, Fragment, Adapter, layouts, and wiring (nav graph, bottom nav, ServiceLocator, strings). Covers project conventions, backend endpoint patterns, and the complete feature scaffold workflow.
category: software-development
---

# Android Feature Addition for Navigate Mama / Family Companion

Use this skill when adding a new feature or screen to the Navigate Mama Android app (Kotlin, package `com.navigatemama`). The app has a core-data module for network/repository, core-model for data classes, core-database for Room, and the app module for UI.

## Project conventions at a glance

| Layer | Package | Pattern |
|-------|---------|---------|
| Models | `com.navigatemama.core.model` | `data class` in `core-model/.../Models.kt` |
| DTOs | `com.navigatemama.core.data.network.dto` | `data class` with `@SerializedName` for snake_case |
| API | `com.navigatemama.core.data.network` | Retrofit interface, `@Query` for GET params, `@Body` for POST |
| Repository | `com.navigatemama.core.data.repository` | `suspend fun` returning `Result<T>`, OkHttp for SSE streams |
| ServiceLocator | `com.navigatemama.app.shared.ServiceLocator` | `@Volatile` + `synchronized` double-check singleton |
| ViewModel | `com.navigatemama.app.<feature>` | `AndroidViewModel`, `LiveData`, `viewModelScope.launch` |
| Fragment | `com.navigatemama.app.<feature>` | `Fragment(layout)`, `by viewModels()`, ViewBinding |
| Adapter | `com.navigatemama.app.<feature>` | `RecyclerView.Adapter`, `submitList()`, `notifyDataSetChanged()` |
| Layouts | `res/layout/fragment_<name>.xml` + `item_<name>.xml` | ViewBinding enabled (`buildFeatures.viewBinding = true`) |
| Strings | `res/values/strings.xml` | `<string name="feature_key">Text</string>` |
| Nav | `res/navigation/main_nav_graph.xml` | `<fragment>` entries |
| Bottom Nav | `res/menu/bottom_nav_menu.xml` | `<item>` with icon + title |

## Feature scaffold workflow (ordered)

### 1. Read existing code to learn conventions
Before writing anything, read at least:
- `ServiceLocator.kt` — repository wiring pattern
- One existing ViewModel (e.g., `HomeViewModel.kt`) — `AndroidViewModel` + `LiveData` pattern
- One existing Fragment (e.g., `JourneyFragment.kt`) — `by viewModels()`, ViewBinding lifecycle
- One existing Repository (e.g., `ProfileRepository` in `NavigateRepositories.kt`) — suspend fun, LiveData
- `libs.versions.toml` — dependency catalog
- Relevant `build.gradle.kts` — existing dependencies for target module

### 2. Add dependencies (if needed)
First check if needed libs are already in the version catalog and module gradle files.
- Add version + library entries to `gradle/libs.versions.toml`
- Add `implementation(libs.xxx)` to the relevant module's `build.gradle.kts`
- The app module inherits core-data dependencies transitively — only add to app if app code directly references the library

### 3. Create DTOs
Place in `core-data/src/main/java/com/navigatemama/core/data/network/dto/`.
- Every field needs `@SerializedName("snake_case_name")` for Gson mapping to the Python backend
- Match the backend schema field names exactly — read the backend `src/schemas/*.py` Pydantic models
- Use `String?` for nullable fields, provide defaults for optional primitive types

### 4. Create Retrofit API interface
Place in `core-data/src/main/java/com/navigatemama/core/data/network/`.
- Base path is assumed from `android.py` routes (e.g., endpoint `@router.post("/chat")` maps to Retrofit `@POST("chat")`)
- Chat endpoints use `@Query` parameters, NOT `@Body` — the backend FastAPI router declares them as `Query(...)`
- Streaming endpoints: use `@Streaming` with `Response<ResponseBody>` return type (parsing is done in the repository via OkHttp directly)
- All other endpoints use standard Retrofit patterns: `@GET` with `@Query`, `@POST` with `@Body`

### 5. Create Repository
Place in `core-data/src/main/java/com/navigatemama/core/data/repository/`.
- Constructor takes all dependencies explicitly (baseUrl, familyId, etc.) with sensible defaults
- Public API: `Result<T>`-wrapped `suspend fun` for one-shot calls; `Flow<T>` for streaming
- SSE streaming: use OkHttp directly (not Retrofit) to build the URL with URL-encoded query params, parse `data:` lines, and emit via `flow { }.flowOn(Dispatchers.IO)`
- In-memory caching is acceptable for profile/places/safety-check — add `getCached*()` accessors
- Chat history tracking: keep a `mutableListOf<Pair<String,String>>()` in the repository

### 6. Register in ServiceLocator
- Add import for the new repository
- Add a `@Volatile private var` field for singleton caching
- Add a public `fun myRepository(context: Context): MyRepository` method with `synchronized` double-check

### 7. Create ViewModel
Place in `app/src/main/java/com/navigatemama/app/<feature>/`.
- Extend `AndroidViewModel(application: Application)`
- Get repository via `ServiceLocator.myRepository(application)`
- Use `MutableLiveData` backing with public `LiveData` accessors
- Launch coroutines in `viewModelScope`
- Handle loading, error, and data states
- For streaming: update a `currentStreamingText` LiveData token-by-token, then finalize into the message list

### 8. Create Fragment
Place in `app/src/main/java/com/navigatemama/app/<feature>/`.
- Constructor: `Fragment(R.layout.fragment_xxx)` (not empty constructor)
- ViewModel: `private val viewModel: MyViewModel by viewModels()`
- ViewBinding: `private var binding: FragmentXxxBinding? = null`, clear in `onDestroyView()`
- Observe LiveData in `onViewCreated` with `viewLifecycleOwner`
- Auto-scroll RecyclerView to bottom on new messages: `recyclerView.post { smoothScrollToPosition(...) }`

### 9. Create Adapter
Place in `app/src/main/java/com/navigatemama/app/<feature>/`.
- `RecyclerView.Adapter<RecyclerView.ViewHolder>` with `getItemViewType()` for multi-type lists (e.g., user vs assistant messages)
- `submitList()` clears and replaces internal list, calls `notifyDataSetChanged()`
- For streaming updates: add a `setStreamingText(text: String?)` method that updates the last item in-place and calls `notifyItemChanged()`
- ViewHolders use the generated binding class: `ItemXxxBinding.inflate(LayoutInflater.from(parent.context), parent, false)`

### 10. Create layouts
- Main fragment layout (`fragment_xxx.xml`): `LinearLayout vertical` with RecyclerView `layout_weight="1"`, input area at bottom
- Item layouts (`item_xxx.xml`): minimal ViewGroup root with bindable children
- Use existing drawables (`bg_card`, `bg_button_primary`) and colors (`@color/ink`) for visual consistency
- Progress indicators: `?android:attr/progressBarStyleHorizontal` with `indeterminate="true"`

### 11. Wire navigation and strings
- Add `<fragment>` entry to `main_nav_graph.xml` with `@+id/xxxFragment` and fully qualified `android:name`
- Add `<item>` to `bottom_nav_menu.xml` with matching ID and an icon from `@android:drawable/`
- Add string resources to `strings.xml` for title, nav label, subtitle, hint text, button labels

## Pitfalls

- **Chat endpoint uses Query params, not JSON body.** The backend's FastAPI route declares parameters as `Query(...)`. Using `@Body` will fail. Always check the backend `android.py` route signature.
- **Streaming SSE must be done via OkHttp directly**, not Retrofit's `@Streaming`. Retrofit's `@Streaming` is for large response bodies; SSE parsing needs line-by-line `data:` token extraction. Build the URL manually with `java.net.URLEncoder`.
- **Snake_case JSON mapping requires `@SerializedName` on every field.** Gson does not auto-convert camelCase to snake_case without configuration. This project does not configure a global naming policy — annotate each field.
- **ViewBinding lifecycle:** Set `binding = null` in `onDestroyView()` to avoid leaks. The `by viewModels()` delegate is backed by the Fragment, not Activity, so it survives config changes.
- **ServiceLocator is a singleton** — the companion repository must be cached with `@Volatile` + `synchronized` to avoid regenerating a random defaultFamilyId on every access.
- **Bottom nav IDs must match nav graph fragment IDs** for Navigation component to link them automatically. Use the same `@+id/` value in both XML files.
