<script>
  let selectedId = $state("general");

  const journeys = [
    { 
      id: "general", 
      x: 180, y: 180, 
      label: "General Journey", 
      color: "#EC3750", 
      prizes: ["Sticker Pack", "32GB USB STICK", ".com Domain (Non-Premium)", "Treasure hunt T-Shirt", "Treasure hunt Shirt Pin", "Hack Club Socks", "A Book with participants' Projects"] 
    },
    { 
      id: "soon", 
      x: 500, y: 120, 
      label: "soon", 
      color: "#FFB400", 
      prizes: [],
      locked: true
    },
    { 
      id: "hardware", 
      x: 780, y: 280, 
      label: "Hardware Journey", 
      color: "#33D6A6", 
      prizes: ["PI pico 2", "USB Logic Analyzer", "Multimeter", "Wire stripper", "Networking Kit", "Mini Microscope X1600", "Thermal Printer"] 
    },
    { 
      id: "soon2", 
      x: 420, y: 450, 
      label: "soon", 
      color: "#1B2D48", 
      prizes: [],
    locked: true
    }
  ];

  function select(id) {
    const journey = journeys.find((j) => j.id === id);
    if (journey?.locked) return;
    selectedId = id;
  }

  let isPressed = $state(false);

  async function setExpedition() {
    await fetch("/api/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ expedition: selectedId })
    });
    location.href = "/dashboard";
  }
</script>

<div style="width: 100%; max-width: 1000px; margin: 20px auto; filter: drop-shadow(12px 12px 0px rgba(27, 45, 72, 0.15));">
  <svg viewBox="0 0 1000 750" xmlns="http://www.w3.org/2000/svg" style="overflow: visible;">
    
    <path d="M40,50 Q60,20 250,30 L850,25 Q960,35 940,110 L960,670 Q920,730 500,710 L80,730 Q30,710 45,350 L35,100 Q30,45 40,50 Z" 
          fill="#F3E1AD" stroke="#1B2D48" stroke-width="6" stroke-linejoin="round" />

    <path d="M180,180 C330,130 430,80 500,120 S730,230 780,280 S530,480 420,450" 
          fill="none" stroke="#8b5e3c" stroke-width="12" stroke-dasharray="1,20" stroke-linecap="round" opacity="0.2" />

    {#each journeys as journey}
      <g transform="translate({journey.x}, {journey.y})" on:click={() => select(journey.id)} style="cursor: pointer;">
        
        {#if selectedId === journey.id}
          <g transform="translate({journey.x > 600 ? -240 : 50}, -100)">
            <path d="M0,5 Q5,0 100,3 L200,0 Q215,10 210,35 L218,245 Q190,265 100,255 L5,265 Q-8,255 2,125 Z" 
                  fill="#FFF" stroke="#1B2D48" stroke-width="3" filter="drop-shadow(4px 4px 0px rgba(27, 45, 72, 0.1))" />
            
            <foreignObject x="20" y="20" width="170" height="220">
              <div style="font-family: 'Comic Sans MS', sans-serif; color: #1B2D48;">
                <div style="text-align: center; font-weight: 900; font-size: 13px; color: #EC3750; margin-bottom: 10px; text-transform: uppercase;">
                  Loot Unlocked
                </div>
                <ul style="margin: 0; padding: 0; list-style: none; font-family: monospace; font-size: 11px; line-height: 1.5; font-weight: bold;">
                  {#each journey.prizes as prize, i}
                    <li style="margin-bottom: 4px; border-bottom: 1px dashed rgba(27,45,72,0.1);">
                      <span style="color: #EC3750;">[{i + 1}]</span> {prize}
                    </li>
                  {/each}
                </ul>
              </div>
            </foreignObject>
            
            <circle cx="195" cy="240" r="10" fill={journey.color} stroke="#1B2D48" stroke-width="2" />
          </g>
        {/if}

        <text y="-65" text-anchor="middle" font-family="'Comic Sans MS', sans-serif" font-weight="900" font-size="14" fill="#1B2D48">
          {journey.label.toUpperCase()}
        </text>

        <circle r="26" fill={selectedId === journey.id ? journey.color : "#E8D5A0"} stroke="#1B2D48" stroke-width="4" style="transition: all 0.2s ease;" />
        {#if selectedId === journey.id}
             <text text-anchor="middle" y="10" font-size="28" fill="white" font-weight="900">✓</text>
        {:else}
             <text text-anchor="middle" y="7" font-size="18" fill="#1B2D48" opacity="0.4">?</text>
        {/if}
      </g>
    {/each}

    <foreignObject x="400" y="620" width="200" height="80">
      <button 
        type="submit"
        on:mousedown={() => isPressed = true}
        on:mouseup={() => isPressed = false}
        on:mouseleave={() => isPressed = false}
        on:click={setExpedition}
        style="width: 100%; height: 55px; background: #FFB400; border: 4px solid #1B2D48; border-radius: 12px; font-family: 'Comic Sans MS', sans-serif; font-weight: 900; cursor: pointer; color: #1B2D48; 
               box-shadow: {isPressed ? 'none' : '0 6px 0 #1B2D48'}; 
               transform: {isPressed ? 'translateY(6px)' : 'none'};
               transition: all 0.05s ease; font-size: 16px;">
        START JOURNEY
      </button>
    </foreignObject>

    <input type="hidden" name="journeySelection" value={selectedId} />
  </svg>
</div>

<style>
  g:hover circle {
    transform: scale(1.1);
  }
  li {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
</style>