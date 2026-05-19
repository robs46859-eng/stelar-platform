# Azure GPU VM Sizes for LLM Inference

Quick reference for choosing Azure GPU VMs for local LLM inference workloads.

## NCasT4_v3 Series (NVIDIA T4, 16GB VRAM)

Good for single-model inference. T4 has 16GB VRAM -- enough for Gemma 4 26B at Q4 (~16GB).

| Size | vCPU | RAM | Local SSD | On-demand/hr | Spot/hr |
|---|---|---|---|---|---|
| NC4as_T4_v3 | 4 | 28GB | 180 GB | ~$0.068 | ~$0.020 |
| NC8as_T4_v3 | 8 | 56GB | 360 GB | ~$0.098 | ~$0.029 |
| NC16as_T4_v3 | 16 | 110GB | 360 GB | ~$1.20 | ~$0.36 |
| NC64as_T4_v3 | 64 | 448GB | 4x 360 GB | ~$4.80 | ~$1.44 |

**Recommendation:** NC8as_T4_v3 or NC16as_T4_v3 for Gemma 4 26B. The 360GB local SSD is large enough to hold the model (~17GB for Q4) without needing a separate managed disk.

## NC A100 v4 Series (NVIDIA A100, 40GB or 80GB VRAM)

For max throughput or multiple/larger models. Overkill for a single 26B model.

## Key Notes

- **Local SSD is ephemeral** -- can be wiped if VM is deallocated or moved to a different host. Use managed disks for data that must survive deallocation.
- **Managed disks can be detached and reattached** to a new VM after resize. The disk survives VM deallocation.
- **GPU quota** must be requested in your Azure subscription before you can create GPU VMs. Default quota is often 0.
- **Resize process:** deallocate → resize → start. Managed disks stay attached through resize.
- **Spot instances** save ~70% but can be evicted with 30 seconds notice. Fine for batch inference, not for production serving.
