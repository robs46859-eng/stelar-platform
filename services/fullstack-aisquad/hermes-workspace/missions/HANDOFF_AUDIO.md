# Audio Production Swarm Handoff

## Progress Summary
- **Research Brief**: Completed (`research-brief.md`) – outlines product concept, pain themes, competitor map, and recommendations.
- **Product Requirements Document (PRD)**: Completed (`product-prd.md`) – defines features, success metrics, timeline, and open questions.
- **Draft Content**: Week 01 chapter written (`drafts/week01.md`) – includes Body, Baby, Mental Health, Partner Playbook, and Call Doctor sections with signal pull‑quotes and medical sources.
- **Audio Production**: Not yet started – no audio files exist.

## Files Created
| Path | Description |
|------|-------------|
| `/home/azureuser/fullstack-aisquad/missions/research-brief.md` | Research brief with signal‑derived insights. |
| `/home/azureuser/fullstack-aisquad/missions/product-prd.md` | PRD outlining product scope, features, and success criteria. |
| `/home/azureuser/fullstack-aisquad/missions/drafts/week01.md` | First‑week chapter draft (text only). |
| *(none)* | `drafts/week01_audio.mp3` – pending creation. |

## Open Items
1. **Audio Script Preparation**  
   - Extract narration script from each weekly chapter (weeks 01‑12).  
   - Ensure script is formatted for TTS or human narration (clear, conversational, timestamp‑ready).

2. **Audio Recording & Editing**  
   - Pilot production for Week 01 audio (approx. 7‑8 minutes).  
   - Decide on narration method: in‑house talent, freelancer, or TTS with human review.  
   - Edit for pacing, remove errors, add chapter markers/intros.

3. **Full Audio Companion**  
   - Produce audio for remaining weeks (weeks 02‑12) to reach ~90‑minute total.  
   - Combine chapters into a single MP3 with optional chapter navigation.

4. **Quality Assurance**  
   - Review audio for clarity, volume consistency, and absence of background noise.  
   - Verify pronunciation of medical terms and signal pull‑quotes.  
   - Obtain any needed compliance/medical review for audio content.

5. **Integration & Delivery**  
   - Place final MP3 in `drafts/week01_audio.mp3` (or a combined `audio_companion.mp3`).  
   - Ensure file is ready for bundling with PDF in Stan Store.

## Next Steps (Immediate)
1. **Script Extraction** – Use `content:write` or a helper script to pull clean narration text from `week01.md` (and later weeks).  
2. **Pilot Audio Production** – Assign the `content-producer` worker (media swarm) to record and edit the Week 01 audio.  
3. **Review Loop** – Share pilot audio with the product‑orchestrator and/or QA for feedback.  
4. **Scale Production** – Once pilot is approved, replicate process for remaining weeks.  
5. **Final Assembly** – Concatenate chapter audio files, add metadata, and output final MP3.

## Notes & Dependencies
- The audio production swarm is part of the **Media Swarm**, specifically the `content-producer` worker (wrapper `content:produce`).  
- No specific audio configuration files exist yet; we may need to create a simple config for bitrate, format, and chapter markers.  
- Dependencies: access to a quiet recording space, microphone, and audio editing software (Audacity, Adobe Audition, or equivalent). If using TTS, ensure license and voice selection match brand tone (trustworthy, calm, expert).  
- Coordinate with `product-orchestrator` for timelines and with `qa:verify` for final audio QA.

---
*Prepared by Hermes Agent (audio production subagent) on 2026-05-15.*