<script>
  let { data } = $props();

  let firstName = $state('');
  let lastName = $state('');
  let address1 = $state('');
  let address2 = $state('');
  let city = $state('');
  let state = $state('');
  let zip = $state('');
  let country = $state('');
  let email = $state('');
  let phone = $state('');
  let hasHydratedUser = false;
  let isUpdating = $state(false);

  $effect(() => {
    if (hasHydratedUser || !data?.user) return;

    firstName = data.user.firstName ?? '';
    lastName = data.user.lastName ?? '';
    address1 = data.user.homeAddress?.address1 ?? '';
    address2 = data.user.homeAddress?.address2 ?? '';
    city = data.user.homeAddress?.city ?? '';
    state = data.user.homeAddress?.state ?? '';
    zip = data.user.homeAddress?.zip ?? '';
    country = data.user.country ?? '';
    email = data.user.emailAddress ?? '';
    phone = data.user.phoneNumber ?? '';
    hasHydratedUser = true;
  });

  async function updateSettings() {
    if (isUpdating) return;
    isUpdating = true;
    try {
      const response = await fetch('/api/updateSettings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          homeAddress: {
            address1,
            address2,
            city,
            state,
            zip
          },
          country,
          emailAddress: email,
          phoneNumber: phone
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update settings');
      }
      alert('Settings updated successfully!');
      location.reload();
    } catch (error) {
      console.error('Error updating settings:', error);
      alert('An error occurred while updating settings. Please try again.');
    }
    finally {
      isUpdating = false;
    }
  };
</script>
<div style="width: 100%; max-width: 850px; margin: 20px auto; filter: drop-shadow(8px 8px 0px rgba(27, 45, 72, 0.15));">
  <svg viewBox="0 0 850 1100" xmlns="http://www.w3.org/2000/svg">
    <path d="M40,50 Q60,20 200,30 L650,20 Q810,30 800,110 L820,1010 Q790,1090 640,1080 L160,1100 Q40,1090 55,960 L30,310 Q25,70 40,50 Z" 
          fill="#F3E1AD" 
          stroke="#1B2D48" 
          stroke-width="5" 
          stroke-linejoin="round" />

    <text x="425" y="90" text-anchor="middle" font-family="'Luckiest Guy', cursive" font-weight="900" font-size="32" fill="#1B2D48">ACCOUNT SETTINGS</text>
    <path d="M300,110 L550,110" stroke="#1B2D48" stroke-width="2" stroke-dasharray="8,4" opacity="0.3" />

    <g transform="translate(80, 160)">
      
      <text x="0" y="0" font-family="'Luckiest Guy', cursive" font-weight="900" font-size="14" fill="#EC3750" opacity="0.8">I. PERSONAL DETAILS</text>
      
      <text x="0" y="30" font-family="'Luckiest Guy', cursive" font-weight="bold" font-size="14" fill="#1B2D48">FIRST NAME</text>
      <foreignObject x="0" y="40" width="330" height="40">
        <input
          class="field-input"
          bind:value={firstName}
          aria-label="First name"
          type="text"
        />
      </foreignObject>
      
      <text x="360" y="30" font-family="'Luckiest Guy', cursive" font-weight="bold" font-size="14" fill="#1B2D48">LAST NAME</text>
      <foreignObject x="360" y="40" width="330" height="40">
        <input
          class="field-input"
          bind:value={lastName}
          aria-label="Last name"
          type="text"
        />
      </foreignObject>

      <text x="0" y="125" font-family="'Luckiest Guy', cursive" font-weight="900" font-size="14" fill="#EC3750" opacity="0.8">II. CONTACT LINKS</text>

      <text x="0" y="155" font-family="'Luckiest Guy', cursive" font-weight="bold" font-size="14" fill="#1B2D48">EMAIL ADDRESS</text>
      <foreignObject x="0" y="165" width="690" height="40">
        <input
          class="field-input"
          bind:value={email}
          aria-label="Email address"
          type="email"
        />
      </foreignObject>

      <text x="0" y="240" font-family="'Luckiest Guy', cursive" font-weight="bold" font-size="14" fill="#1B2D48">PHONE NUMBER</text>
      <foreignObject x="0" y="250" width="330" height="40">
        <input
          class="field-input"
          bind:value={phone}
          aria-label="Phone number"
          type="tel"
        />
      </foreignObject>

      <text x="0" y="335" font-family="'Luckiest Guy', cursive" font-weight="900" font-size="14" fill="#EC3750" opacity="0.8">III. EXPEDITION BASE (ADDRESS)</text>

      <text x="0" y="365" font-family="'Luckiest Guy', cursive" font-weight="bold" font-size="14" fill="#1B2D48">ADDRESS LINE 1</text>
      <foreignObject x="0" y="375" width="690" height="40">
        <input
          class="field-input"
          bind:value={address1}
          aria-label="Address line 1"
          type="text"
        />
      </foreignObject>

      <text x="0" y="450" font-family="'Luckiest Guy', cursive" font-weight="bold" font-size="14" fill="#1B2D48">ADDRESS LINE 2 (OPTIONAL)</text>
      <foreignObject x="0" y="460" width="690" height="40">
        <input
          class="field-input"
          bind:value={address2}
          aria-label="Address line 2"
          type="text"
        />
      </foreignObject>

      <text x="0" y="535" font-family="'Luckiest Guy', cursive" font-weight="bold" font-size="14" fill="#1B2D48">CITY</text>
      <foreignObject x="0" y="545" width="330" height="40">
        <input
          class="field-input"
          bind:value={city}
          aria-label="City"
          type="text"
        />
      </foreignObject>

      <text x="360" y="535" font-family="'Luckiest Guy', cursive" font-weight="bold" font-size="14" fill="#1B2D48">STATE / PROVINCE</text>
      <foreignObject x="360" y="545" width="330" height="40">
        <input
          class="field-input"
          bind:value={state}
          aria-label="State or province"
          type="text"
        />
      </foreignObject>

      <text x="0" y="620" font-family="'Luckiest Guy', cursive" font-weight="bold" font-size="14" fill="#1B2D48">ZIP / POSTAL CODE</text>
      <foreignObject x="0" y="630" width="200" height="40">
        <input
          class="field-input"
          bind:value={zip}
          aria-label="Zip or postal code"
          type="text"
        />
      </foreignObject>

      <text x="230" y="620" font-family="'Luckiest Guy', cursive" font-weight="bold" font-size="14" fill="#1B2D48">COUNTRY</text>
      <foreignObject x="230" y="630" width="460" height="40">
        <input
          class="field-input"
          bind:value={country}
          aria-label="Country"
          type="text"
        />
      </foreignObject>

      <foreignObject x="195" y="735" width="300" height="60">
        <div xmlns="http://www.w3.org/1999/xhtml" style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;">
          <button class="update-btn" onclick={updateSettings} disabled={isUpdating}>
            {#if isUpdating}
              UPDATING...
            {:else}
              UPDATE SETTINGS
            {/if}
          </button>
        </div>
      </foreignObject>
    </g>

    <g transform="translate(750, 1000) scale(0.6)" opacity="0.2">
      <circle cx="0" cy="0" r="40" fill="none" stroke="#1B2D48" stroke-width="4" />
      <path d="M0,-40 L10,0 L0,40 L-10,0 Z" fill="#EC3750" />
    </g>
  </svg>
</div>

<style>
  .field-input {
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    border: 2px solid #1B2D48;
    border-radius: 8px;
    background: #E8D5A0;
    color: #1B2D48;
    padding: 0 12px;
    font: 600 14px sans-serif;
    outline: none;
  }

  .field-input:focus {
    background: #F7E7BD;
    box-shadow: inset 0 0 0 2px rgba(236, 55, 80, 0.25);
  }

  .update-btn {
    width: 300px;
    height: 48px;
    background: #FFB400;
    border: 3px solid #1B2D48;
    border-radius: 8px;
    color: #1B2D48;
    font-weight: 900;
    font-family: 'Luckiest Guy', cursive;
    font-size: 16px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .update-btn:disabled {
    opacity: 0.6;
    cursor: default;
  }
</style>