# AniRecall — Class Presentation & Demo Script

**Project Title:** AniRecall  
**Tagline:** “You remember the scene. We’ll find the anime.”  
**Developers:** Developed by Mawutorwu Klu and Skythen Therlonge.  
**Target Duration:** 3–5 Minutes  
**Live Application:** https://anirecall-j8s1rwnh6-klum-3379.vercel.app  
**GitHub Repository:** https://github.com/mawu-stack/anirecall  

---

## Demo Overview
This script demonstrates AniRecall’s agentic workflow for identifying anime from partial, uncertain, or fragmented human memories without knowing the title.

---

### Step 1: The Vague Memory (Natural-Language Search)
1. **Action:** Navigate to the AniRecall homepage.
2. **Narration:** *"Most anime search engines require you to already know the title or character name. AniRecall is built for that frustrating feeling when you only remember a bizarre scene or a vague memory from years ago."*
3. **Input:** Type or click the example:
   > *"I watched this around 2018 on Netflix. It was about a mad scientist in an old building who puts green bananas into a microwave oven and it turns them into gel, and somehow they send text messages back in time."*
4. **Click:** `Recall` (or press `Enter`).

---

### Step 2: Clue Extraction & Categorization
1. **Show:** Point to the **Extracted Memory Clues** panel on the left.
2. **Narration:** *"Notice how AniRecall's server-side tool immediately breaks down our natural language into discrete, typed memory chips:*
   - **Scene:** *Putting green bananas in modified microwave to turn them into gel*
   - **Setting:** *Akihabara lab / old building*
   - **Watched In:** *Watched around 2018 (correctly distinguished from release year)*
   - **Genre:** *Sci-Fi / Time Travel*
   - **Platform:** *Netflix*
3. **Interaction:** Click the `Sure` badge on a clue to toggle it to `Maybe`, showing how uncertain memories become soft preferences rather than strict hard filters.

---

### Step 3: Agent Follow-Up Question (Ambiguity Resolution)
1. **Action:** Now enter a deliberately ambiguous memory into the search box:
   > *"Supernatural thriller with mind games and detectives where characters fight with supernatural powers"*
2. **Click:** `Recall`.
3. **Show:** The **Agent Follow-Up Question** banner appears above the candidate list:
   > *“Between Fate/Zero and Tokyo Ghoul, do you recall any specific weapon, school uniform, or supernatural power?”*
4. **Narration:** *"When multiple candidates have close relevance scores, the agent doesn't force a guess. It analyzes the differences between the top candidates and poses a single discriminating question."*
5. **Click:** Select the quick-answer pill: `Supernatural / Magic powers`.
6. **Result:** The agent re-evaluates the candidate pool and re-ranks the results based on the new evidence.

---

### Step 4: Grounded Results & Verification Matrix
1. **Show:** The ranked candidate cards on the right.
2. **Narration:** *"AniRecall grounds every guess in verified catalog records from AniList and MyAnimeList. Notice:*
   - **Match Tier:** *Labeled as 'Strong match' or 'Possible match' only when supported by evidence.*
   - **Matching Clues (Green):** *Explicitly states which user clues matched catalog records.*
   - **Conflicting Clues (Red):** *Highlights date, format, or genre discrepancies.*
   - **Unverified Clues (Gray):** *Clearly admits when specific user memories cannot be verified from high-level catalog summaries.*
3. **Spoiler Shield:** Click `Reveal Key Plot Twist` on a candidate to demonstrate that major plot resolutions are shielded behind explicit user consent.

---

### Step 5: Side-by-Side Candidate Comparison
1. **Action:** Click `Compare` on candidate 1 (*Fate/Zero*) and candidate 2 (*Tokyo Ghoul*).
2. **Show:** The **Side-by-Side Comparison Modal** opens.
3. **Narration:** *"The comparison modal cross-references both candidates in a verification matrix against the user's clues, highlighting where they align, where they diverge, and offering a key question to distinguish them."*
4. **Close Modal.**

---

### Step 6: Negative Feedback & Exclusion ("That's not it")
1. **Action:** On an incorrect candidate, click the red `That's not it` button.
2. **Narration:** *"AniRecall preserves exclusions. When a candidate is rejected, it is permanently filtered out for this session, and the next most relevant candidate is promoted."*
3. **Action:** Click `Close, but...` to demonstrate adding quick refinements (e.g., *"Mine had white hair and an eyepatch"*).

---

### Step 7: Confirmation & "Similar Vibes" Recommendations
1. **Action:** On the correct candidate (*Steins;Gate* or *Tokyo Ghoul*), click `Found it!`.
2. **Show:** The **Similar Vibes** modal immediately appears.
3. **Narration:** *"Confirming a match does two things: it saves the discovery to your private browser collection, and it generates recommendations based on the specific vibe you loved—whether that's the dark psychological tone, worldbuilding, or character dynamics."*
4. **Close Modal.**

---

### Step 8: Found It! History & Privacy
1. **Action:** Click the `Found It! Collection` tab in the top navigation.
2. **Show:** The saved card displaying the confirmed title, poster, date, and the user's original query.
3. **Narration:** *"All saved history is kept strictly in browser LocalStorage. No account is required, and user searches are never tracked or saved to a remote database."*
4. **Action:** Click `Reopen Search Clues` to show instant recovery of previous search states.
