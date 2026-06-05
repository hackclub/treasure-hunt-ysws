<script>
    import { invalidateAll } from '$app/navigation';
    import ItemAlert from '$lib/commponents/ItemAlert.svelte';
    import ItemCard from '$lib/commponents/itemCard.svelte';

    let { data } = $props();
    let items = $derived(data.items);
    let error = $derived(data.error);
    let isLoading = $derived(false);
    let selectedItem = $state(null);
    let selectedCountry = $state("global");

    const COUNTRIES = [
        { id: "global", label: "🌍 Global" },
        { id: "india", label: "🇮🇳 India" },
    ];

    function openItemAlert(event) {
        selectedItem = event.detail.item;
    }

    async function closeItemAlert(event) {
        if (event.detail?.reason === 'success') {
            await invalidateAll();
        }

        selectedItem = null;
    }
</script>

{#if isLoading}
    <p>Loading shop items...</p>
{:else if error}
    <p>{error}</p>
{:else if items.length === 0}
    <p>No shop items available.</p>
{:else}
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 0.75rem;">
        <a href="/dashboard/shop/orders" style="display: inline-flex; align-items: center; justify-content: center; padding: 0.9rem 1.4rem; background: #FFB400; color: #1B2D48; border: 4px solid #1B2D48; border-radius: 12px; font-family: 'Comic Sans MS', sans-serif; font-weight: 900; text-decoration: none; box-shadow: 0 6px 0 #1B2D48; transition: transform 0.05s ease, box-shadow 0.05s ease;">
            VIEW ORDERS
        </a>
        <div style="display: flex; gap: 0.5rem; align-items: center;">
            {#each COUNTRIES as country}
                <button
                    onclick={() => selectedCountry = country.id}
                    style="padding: 0.5rem 1rem; font-family: 'Comic Sans MS', sans-serif; font-weight: 900; font-size: 0.85rem; border: 3px solid #1B2D48; border-radius: 8px; cursor: pointer; transition: transform 0.05s ease, box-shadow 0.05s ease; background: {selectedCountry === country.id ? '#1B2D48' : '#F3E1AD'}; color: {selectedCountry === country.id ? '#F3E1AD' : '#1B2D48'}; box-shadow: {selectedCountry === country.id ? '0 3px 0 #FFB400' : '0 3px 0 #1B2D48'};">
                    {country.label}
                </button>
            {/each}
        </div>
    </div>
    <div style="display: flex; flex-wrap: wrap; gap: 1rem; justify-content: center;">
        {#each items as item, index (item.recId ?? item.id ?? index)}
            <ItemCard itemData={item} {selectedCountry} on:buy={openItemAlert} />
        {/each}
    </div>
{/if}

{#if selectedItem}
    <ItemAlert item={selectedItem} {selectedCountry} on:close={closeItemAlert} />
{/if}
