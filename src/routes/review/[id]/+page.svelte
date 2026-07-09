<script>
import { onMount } from "svelte";
import { page } from "$app/stores";
    import { DisplayName } from "hackclub-forms";
    import { parseRejectionHistory, formatRejectionDate } from "$lib/rejectionHistory";
const id = $page.params.id;
    // The data coming from your server or API
//    let projects = [
//        {
//            id: "1",
//            name: "A random project",
//            description: "A very projectyproject",
//            imageUrl: "https://via.placeholder.com/370x210",
//            originality: "Trusted",
//            reviewStatus: "unreviewd",
//            category: "Web app",
//            hoursSpent: "22.5",
//            repositoryLink: "myhackatimeproject",
//            aiUsage: "Ammm whats AI?"
//        }
//    ];
    let projects = $state([]);
    let project = $state({});
    let finalHours = $state("");
    let trustLevel = $state("");
    let finalHoursinHours = $state("");
    let slackId = $state("");
    let claimedBy = $state("");
    let currentSlackId = $state("");
    let claimedExpiresAt = $state("");
    let claimBusy = $state(false);
    let claimClock = $state(Date.now());
    let showDisplayName = $state(false);

    // Past rejections of this project, newest first. Empty on a first submission.
    const rejections = $derived(parseRejectionHistory(project.rejectionHistory));

    const isClaimedByMe = () => Boolean(claimedBy) && claimedBy === currentSlackId;
    const isLocked = () => Boolean(claimedBy) && !isClaimedByMe();
    const formatRemainingTime = (remainingMs) => {
      const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000));
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
    };
    const getRemainingMs = () => {
      const expiresAt = claimedExpiresAt ? Date.parse(claimedExpiresAt) : 0;
      return expiresAt ? Math.max(0, expiresAt - claimClock) : 0;
    };
    const claimButtonLabel = () => {
      if (isClaimedByMe()) return "UNCLAIM REVIEW";
      if (isLocked()) return "LOCKED";
      return "CLAIM REVIEW";
    };

    const loadClaimState = async () => {
      try {
        const response = await fetch(`/api/review/getClaimer/${id}`);
        if (!response.ok) {
          if (response.status === 404) {
            claimedBy = "";
            return;
          }
          throw new Error(await response.text());
        }
        const data = await response.json();
        claimedBy = data.claimedBy || "";
        currentSlackId = data.slackId || "";
        claimedExpiresAt = data.expiresAt || "";
      } catch (error) {
        console.error("Error fetching claim state:", error);
      }
    };

    const toggleClaim = async () => {
      if (claimBusy || isLocked()) return;
      claimBusy = true;
      try {
        const endpoint = isClaimedByMe() ? `/api/review/unclaim/${id}` : `/api/review/claim/${id}`;
        const response = await fetch(endpoint);
        if (!response.ok) {
          throw new Error(await response.text());
        }
        await loadClaimState();
      } catch (error) {
        console.error("Error toggling claim:", error);
      } finally {
        claimBusy = false;
      }
    };

    // get hours through https://hackatime.hackclub.com/api/v1/users/U091DE0M4NB/stats?features=projects&start_date=2026-05-30&end_date=2026-08-31
    const fetchHours = async () => {
        try {
      const response = await fetch(`https://hackatime.hackclub.com/api/v1/users/${slackId}/stats?features=projects&start_date=2026-05-30&end_date=2026-08-31`);
            const data = await response.json();
        const stats = data.data ?? data;
          trustLevel = data.trust_factor?.trust_level || stats.trust_factor?.trust_level || "";
        const projectData = stats.projects?.find((p) => p.name === project.hackatimeProject);
            if (projectData) {
          finalHours = projectData.text || `${(projectData.total_seconds / 3600).toFixed(2)}h`;
          finalHoursinHours = project.overrideHoursSpent != null
            ? String(project.overrideHoursSpent)
            : (projectData.total_seconds / 3600).toFixed(2);
            } else {
                console.warn("Project not found in hackatime stats");
            }
        } catch (error) {
            console.error("Error fetching hours from hackatime:", error);
        }
    };

    onMount(() => {
      showDisplayName = true;
      void loadClaimState();
      const claimClockInterval = setInterval(() => {
        claimClock = Date.now();
      }, 1000);
        let projectsRequest = fetch('/api/review/getPending')
            .then(response => response.json())
            .then(data => {
                return data.projects;
            })
            .catch(error => {
                console.error('Error fetching projects:', error);
                return [];
            });
        projectsRequest.then(fetchedProjects => {
            projects = fetchedProjects;
          project = projects.find((item) => String(item.id) === String(id)) ?? {};
          slackId = project.slackId;
          if (project.user && project.hackatimeProject) {
              fetchHours();
          }
        });
          return () => clearInterval(claimClockInterval);
    });
        let justification = $state("");
        let checklist = {
          functionalComplete: false,
          effortOriginality: false,
          readmeAndRepo: false,
          historyAndNotes: false
        };

    let submittingDecision = $state(false);
    let decisionError = $state("");

    const submitDecision = async (decision) => {
      if (submittingDecision) return;
      decisionError = "";
      if (decision === "reject" && !justification.trim()) {
        decisionError = "A justification is required to reject a project.";
        return;
      }
      submittingDecision = true;
      try {
        const payload = { projectId: id, reason: justification };
        if (decision === "approve") {
          const parsed = parseFloat(finalHoursinHours);
          if (Number.isFinite(parsed) && parsed > 0) {
            payload.overrideHours = parsed;
          }
        }
        const response = await fetch(`/api/review/${decision}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const body = await response.json().catch(() => null);
          throw new Error(body?.error || `Request failed with status ${response.status}`);
        }

        window.location.href = "/review";
      } catch (error) {
        console.error(`Error submitting ${decision}:`, error);
        decisionError = error instanceof Error ? error.message : String(error);
      } finally {
        submittingDecision = false;
      }
    };
</script>

<form action="?/review" method="POST" style="width: 100%; max-width: 1000px; margin: 20px auto; filter: drop-shadow(10px 10px 0px rgba(27, 45, 72, 0.15)); position: relative;">
  {#if rejections.length}
    <div style="background: #F3E1AD; border: 4px solid #EC3750; border-radius: 8px; padding: 14px 18px; margin-bottom: 12px; color: #1B2D48;">
      <h3 style="margin: 0 0 8px 0; font-family: sans-serif; font-size: 14px; font-weight: 900; color: #EC3750;">
        PREVIOUSLY REJECTED {rejections.length} {rejections.length === 1 ? "TIME" : "TIMES"}
      </h3>
      <div style="max-height: 240px; overflow-y: auto;">
        {#each rejections as entry, index}
          <div style={`padding: 8px 0; ${index > 0 ? "border-top: 2px dashed rgba(27, 45, 72, 0.25);" : ""}`}>
            <div style="font-family: sans-serif; font-size: 11px; font-weight: 900; color: #1B2D48; opacity: 0.6; margin-bottom: 4px;">
              {index === 0 ? "MOST RECENT" : `ATTEMPT ${rejections.length - index}`} · {formatRejectionDate(entry.at)}
            </div>
            <div style="font-family: monospace; font-size: 13px; white-space: pre-wrap; word-break: break-word;">{entry.reason}</div>
          </div>
        {/each}
      </div>
    </div>
  {/if}
  <div style="position: relative;">
  <button type="button" onclick={toggleClaim} disabled={isLocked() || claimBusy} style="position: absolute; top: 55px; right: 70px; z-index: 3; width: 220px; height: 45px; background: #FFB400; border: 3px solid #1B2D48; border-radius: 8px; font-family: 'Comic Sans MS', sans-serif; font-weight: 900; cursor: pointer; box-shadow: 0 4px 0 #1B2D48;">
    {claimBusy ? "..." : claimButtonLabel()}
  </button>
  {#if claimedBy}
    <div style="position: absolute; top: 106px; right: 70px; z-index: 3; width: 220px; font-family: monospace; font-size: 11px; font-weight: 900; color: #1B2D48; text-align: center; background: rgba(232, 213, 160, 0.98); border: 2px solid #1B2D48; border-radius: 9999px; padding: 4px 8px;">
      {#if isClaimedByMe()}
        claimed by you · {formatRemainingTime(getRemainingMs())} left
      {:else}
        locked by {claimedBy} · {formatRemainingTime(getRemainingMs())} left
      {/if}
    </div>
  {/if}
  <div style:opacity={isClaimedByMe() ? 1 : 0.5} style:pointer-events={isClaimedByMe() ? "auto" : "none"}>
  <svg viewBox="0 0 1000 1450" xmlns="http://www.w3.org/2000/svg" style="display: block;">
    
    <path d="M40,50 Q60,20 200,30 L800,20 Q970,30 960,110 L980,1360 Q950,1440 800,1430 L160,1450 Q40,1440 55,1310 L30,310 Q25,70 40,50 Z" 
          fill="#F3E1AD" 
          stroke="#1B2D48" 
          stroke-width="6" 
          stroke-linejoin="round" />

    <text x="70" y="90" font-family="'Comic Sans MS', 'Chalkboard SE', sans-serif" font-weight="900" font-size="34" fill="#1B2D48">REVIEW CHECK</text>

    <line x1="70" y1="120" x2="930" y2="120" stroke="#1B2D48" stroke-width="3" stroke-dasharray="10,5" opacity="0.3" />

    <g transform="translate(70, 160)">
      <text x="0" y="0" font-family="sans-serif" font-weight="900" font-size="12" fill="#EC3750" opacity="0.7">PROJECT NAME</text>
      <foreignObject x="0" y="10" width="860" height="45">
        <input type="text" name="projectName" readonly bind:value={project.projectName} 
               style="width: 100%; height: 100%; background: #E8D5A0; border: 2px solid #1B2D48; border-radius: 8px; padding: 0 15px; font-family: monospace; font-weight: bold; font-size: 18; color: #1B2D48;" />
      </foreignObject>
    </g>

    <g transform="translate(70, 250)">
      <text x="0" y="-10" font-family="sans-serif" font-weight="900" font-size="12" fill="#EC3750" opacity="0.7">SCREENSHOT</text>
      <path d="M5,10 Q10,2 40,5 L360,2 Q375,10 372,40 L378,200 Q360,215 180,210 L30,218 Q5,210 8,100 Z" fill="#E8D5A0" stroke="#1B2D48" stroke-width="3" />
      <image href={project.screenshot?.[0]?.url || project.screenshot} x="5" y="5" width="370" height="210" opacity="0.8"/>

      <g transform="translate(420, 0)">
        <text x="0" y="-10" font-family="sans-serif" font-weight="900" font-size="12" fill="#EC3750" opacity="0.7">DESCRIPTION</text>
        <foreignObject x="0" y="0" width="460" height="215">
          <textarea readonly bind:value={project.description}
                    style="width: 100%; height: 100%; background: #E8D5A0; border: 2.5px solid #1B2D48; border-radius: 8px; padding: 15px; font-family: sans-serif; font-size: 13px; color: #1B2D48; resize: none;"></textarea>
        </foreignObject>
      </g>
    </g>

    <g transform="translate(70, 520)">
      <text x="0" y="-5" font-family="sans-serif" font-weight="900" font-size="11" fill="#EC3750">HACKATIME TRUST</text>
      <foreignObject x="0" y="0" width="200" height="35"><input type="text" readonly bind:value={trustLevel} style="width: 100%; height: 100%; background: #1B2D48; color: #F3E1AD; border: none; border-radius: 6px; text-align: center; font-family: monospace; font-weight: 900;" /></foreignObject>
      
      <text x="220" y="-5" font-family="sans-serif" font-weight="900" font-size="11" fill="#EC3750">STATUS</text>
      <foreignObject x="220" y="0" width="200" height="35"><input type="text" readonly bind:value={project.status} style="width: 100%; height: 100%; background: #E8D5A0; border: 2px solid #1B2D48; border-radius: 6px; text-align: center; font-weight: bold;" /></foreignObject>
      
      <text x="440" y="-5" font-family="sans-serif" font-weight="900" font-size="11" fill="#EC3750">USER</text>
      <foreignObject x="440" y="0" width="200" height="35">
        <div style="width: 100%; height: 100%; background: #E8D5A0; border: 2px solid #1B2D48; border-radius: 6px; text-align: center; font-family: monospace; display: flex; align-items: center; justify-content: center;">
          {#if showDisplayName && slackId}
            @<DisplayName slackId={slackId} />
          {/if}
        </div>
      </foreignObject>
      
      <text x="660" y="-5" font-family="sans-serif" font-weight="900" font-size="11" fill="#EC3750">CATEGORY</text>
      <foreignObject x="660" y="0" width="200" height="35"><input type="text" readonly bind:value={project.type} style="width: 100%; height: 100%; background: #E8D5A0; border: 2px solid #1B2D48; border-radius: 6px; text-align: center;" /></foreignObject>
      
      <text x="0" y="60" font-family="sans-serif" font-weight="900" font-size="11" fill="#EC3750">TIME LOGGED</text>
      <foreignObject x="0" y="65" width="200" height="35"><input type="text" readonly value="{finalHours}" style="width: 100%; height: 100%; background: #1B2D48; color: #FFB400; border: none; border-radius: 6px; text-align: center; font-family: monospace; font-weight: 900;" /></foreignObject>
      
      <text x="220" y="60" font-family="sans-serif" font-weight="900" font-size="11" fill="#EC3750">HACKATIME PROJECT NAME</text>
      <foreignObject x="220" y="65" width="640" height="35"><input type="text" readonly bind:value={project.hackatimeProject} style="width: 100%; height: 100%; background: #E8D5A0; border: 2px solid #1B2D48; border-radius: 6px; padding: 0 10px; font-family: monospace;" /></foreignObject>
    </g>

    <g transform="translate(70, 680)">
      <text x="0" y="0" font-family="sans-serif" font-weight="900" font-size="12" fill="#EC3750">AI USAGE</text>
      <foreignObject x="0" y="10" width="860" height="60">
        <textarea readonly bind:value={project.aiUsage} style="width: 100%; height: 100%; background: #E8D5A0; border: 2px solid #1B2D48; border-radius: 8px; padding: 10px; font-family: sans-serif; font-size: 13px; resize: none;"></textarea>
      </foreignObject>
    </g>

    <g transform="translate(70, 780)">
      <foreignObject x="0" y="0" width="860" height="150">
        <div style="font-family: sans-serif; color: #1B2D48; display: flex; gap: 40px;">
          <div style="flex: 1;">
            <h3 style="margin: 0 0 10px 0; font-size: 14px; font-weight: 900; color: #EC3750;">VERIFICATION CHECKLIST</h3>
            <label style="display: block; margin-bottom: 6px; cursor: pointer;"><input type="checkbox" bind:checked={checklist.functionalComplete}> Project is functional and complete</label>
            <label style="display: block; margin-bottom: 6px; cursor: pointer;"><input type="checkbox" bind:checked={checklist.effortOriginality}> Shows meaningful effort, originality, and no plagiarism</label>
            <label style="display: block; margin-bottom: 6px; cursor: pointer;"><input type="checkbox" bind:checked={checklist.readmeAndRepo}> README clear with screenshots/demo; contains executables</label>
            <label style="display: block; margin-bottom: 6px; cursor: pointer;"><input type="checkbox" bind:checked={checklist.historyAndNotes}> Commit/progress history legitimate; follows rules; reviewer notes left</label>
          </div>
           <div style="width: 240px; box-sizing: border-box;">
            
        </div>
      </foreignObject>
    </g>

    <foreignObject x="640" y="780" width="300" height="160">
      <div xmlns="http://www.w3.org/1999/xhtml" style="display:flex; flex-direction:column; gap:6px;">
        <h3 style="margin: 0 0 10px 0; font-size: 14px; font-weight: 900; color: #EC3750;">EXTERNAL ROUTES</h3>
        <button type="button" onclick={() => window.open(project.codeUrl, "_blank", "noopener,noreferrer")} style="display:block; width:100%; box-sizing:border-box; background: #FFB400; border: 2px solid #1B2D48; font-weight: 900; font-size: 13px; padding: 6px 8px; cursor: pointer;">GITHUB</button>
        <button type="button" onclick={() => window.open(project.demoUrl, "_blank", "noopener,noreferrer")} style="display:block; width:100%; box-sizing:border-box; background: #FFB400; border: 2px solid #1B2D48; font-weight: 900; font-size: 13px; padding: 6px 8px; cursor: pointer;">DEMO</button>
        <button type="button" onclick={() => project.readmeUrl && window.open(project.readmeUrl, "_blank", "noopener,noreferrer")} style="display:block; width:100%; box-sizing:border-box; background: #FFB400; border: 2px solid #1B2D48; font-weight: 900; font-size: 13px; padding: 6px 8px; cursor: pointer;">README</button>      </div>
    </foreignObject>

    <g transform="translate(70, 1000)">
      <text x="0" y="0" font-family="sans-serif" font-weight="900" font-size="14" fill="#EC3750">FINAL JUSTIFICATION (REQUIRED)</text>
      <foreignObject x="0" y="15" width="860" height="110">
        <textarea name="justification" required bind:value={justification} placeholder="Explain your decision..." 
                  style="width: 100%; height: 100%; background: #E8D5A0; border: 3px dashed #1B2D48; border-radius: 8px; padding: 15px; font-family: sans-serif; font-size: 14px; color: #1B2D48;"></textarea>
      </foreignObject>

      <text x="0" y="155" font-family="sans-serif" font-weight="900" font-size="14" fill="#EC3750">ADJUSTED FINAL HOURS</text>
      <foreignObject x="0" y="165" width="250" height="55">
        <input type="text" name="finalHours" bind:value={finalHoursinHours} placeholder="e.g. 20"
               style="width: 100%; height: 100%; background: #E8D5A0; border: 3px solid #1B2D48; border-radius: 8px; text-align: center; font-family: monospace; font-weight: 900; font-size: 24px; color: #1B2D48;" />
      </foreignObject>
    </g>

    <foreignObject x="140" y="1290" width="700" height="80">
      <div style="display: flex; gap: 20px;">
        <button type="button" onclick={() => submitDecision("approve")} style="flex: 1; height: 50px; background: #FFB400; border: 4px solid #1B2D48; border-radius: 8px; font-family: 'Comic Sans MS', sans-serif; font-weight: 900; cursor: pointer; color: #1B2D48; transform: rotate(-1deg);">{submittingDecision ? "SAVING..." : "APPROVE"}</button>
        <button type="button" onclick={() => submitDecision("reject")} style="flex: 1; height: 50px; background: #EC3750; border: 4px solid #1B2D48; border-radius: 8px; font-family: 'Comic Sans MS', sans-serif; font-weight: 900; cursor: pointer; color: #F3E1AD; transform: rotate(1deg);">REJECT</button>
        <button type="button" aria-label="Chest" title="Chest" style="width: 50px; height: 50px; border: 4px solid #1B2D48; border-radius: 9999px; background: #E8D5A0 url('/assets/Chest%20-%20side.webp') center / 66px no-repeat; cursor: pointer; flex: 0 0 50px; transition: transform 0.15s ease, box-shadow 0.15s ease, filter 0.15s ease;" onmouseenter={(event) => { event.currentTarget.style.transform = "translateY(-2px)"; event.currentTarget.style.boxShadow = "0 6px 0 #1B2D48"; event.currentTarget.style.filter = "brightness(1.05)"; }} onmouseleave={(event) => { event.currentTarget.style.transform = "translateY(0)"; event.currentTarget.style.boxShadow = "none"; event.currentTarget.style.filter = "none"; }}></button>
      </div>
    </foreignObject>

    {#if decisionError}
      <foreignObject x="140" y="1360" width="700" height="60">
        <div xmlns="http://www.w3.org/1999/xhtml" role="alert" style="background: #EC3750; border: 3px solid #1B2D48; border-radius: 8px; padding: 8px 12px; font-family: sans-serif; font-weight: 900; font-size: 13px; color: #F3E1AD;">
          {decisionError}
        </div>
      </foreignObject>
    {/if}

    <foreignObject x="340" y="1065" width="60%" height="250">
      <div xmlns="http://www.w3.org/1999/xhtml" style="display:flex; align-items:center; justify-content:center; height:100%;">
        <button type="button" onclick={() => window.open('https://hackclub.gitbook.io/ysws-project-submission-guidelines/BLBRN8LIfoCZhFV6oMNR', "_blank", "noopener,noreferrer")} style="display:inline-block; background: #1E90FF; border: 2px solid #0B2540; color: #FFFFFF; font-weight: 900; font-size: 13px; padding: 8px 12px; cursor: pointer; border-radius: 6px; width:100%;">DOCS</button>
      </div>
    </foreignObject>
  </svg>
  </div>
  </div>
</form>

<style>
    /* Styling to ensure checkboxes look slightly more thematic */
    input[type="checkbox"] {
        accent-color: #FFB400;
        transform: scale(1.2);
        margin-right: 8px;
    }
</style>