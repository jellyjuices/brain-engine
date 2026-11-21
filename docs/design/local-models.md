# Local model add-on: one example setup

The brain needs no AI. A local model is an add-on, like the calendar, and it stays off until the owner turns it on in config. This page is one tested setup for a 32 GB Apple silicon home server, researched on 2026-11-20. Another owner may pick a smaller model or skip the add-on.

## The home server

- Hardware: Mac mini (Mac18,5), Apple M6, 12-core CPU, 12-core GPU, 32 GB unified memory, 170 GB/s memory bandwidth.
- Ollama 0.40.16 installed. Since 0.40, Ollama runs MLX builds by default on Apple silicon. GGUF builds still run on llama.cpp.
- The GPU may use about 75% of memory by default, so about 24 GB. Apple does not document this. Some sources say two thirds, about 21 GB.

## The pick

| Job | Model | Ollama tag | Size | Why |
| --- | --- | --- | --- | --- |
| Intake, split, enrich | Qwen3.6-35B-A3B (MoE, 3B active), Apache-2.0 | `qwen3.6:35b-mlx` | 23 GB | Best quality that runs fast here: 59 to 64 tokens a second measured on the home server (M6 Mac mini, 32 GB) |
| Fallback for the above | Qwen3.5-9B, Apache-2.0 | `qwen3.5:9b-mlx` | 8.9 GB | Use if the 35B does not fit on the GPU or makes the home server swap. Best published instruction scores at a safe size (IFEval 91.5) |
| Sort fallback | Qwen3.5-4B, Apache-2.0 | `qwen3.5:4b-mlx` | 4.0 GB | Fast. Step up to the 9B if it guesses badly |
| Search meaning | Qwen3-Embedding-0.6B | `qwen3-embedding:0.6b` | about 0.6 GB | Much stronger than today's `snowflake-arctic-embed-xs`. The search index must be rebuilt |

Settings: `num_ctx` 32768 (16384 for sort), `think: false` for intake and JSON jobs, temperature 0.7 for intake and 0.2 for split. Always set `num_predict`, check the JSON, and retry once: an open Ollama bug (#18567) can make an MLX run print blank space until the cap.

Load on demand: `keep_alive` "10m" during an intake, "0" after the last background job. One model at a time.

## Rejected

- Too big for 32 GB: DeepSeek V4 (all sizes), Kimi K3, Kimi Linear 48B, GLM-5.3, GLM-4.5-Air, MiniMax M3, Hunyuan Hy4 Flash, LongCat-Flash-Lite.
- Too slow for a live turn in the app: Qwen3.8-27B (dense, about 8 tokens a second). Fine for an overnight job.
- No good fit: GLM-4.7-Flash (built for code), ERNIE 4.5 (2025, no Ollama tag).

## Chosen: `qwen3.6:35b-mlx` (owner, 2026-11-21)

Tested on the home server (the Mac mini above) on 2026-11-20 with 18 made-up tasks (comprehension, dates, logic, split, sort, format rules, intake, summary, easy code):

- Every machine-scored check matched Claude Haiku and Claude Sonnet: sort 15/15, format rules 11/11, code 10/10, all JSON valid.
- 40 to 85 tokens a second. Most replies took 0.5 to 2.5 seconds.
- Cold start: 12 s to load, 23 s to read the first prompt. Warm up the model before the owner waits on it.
- `ollama ps`: 25 GB, 100% GPU, MLX runner.
- Memory: swap grew from 0.75 GB to 12.7 GB while loaded. The model fits, but it pushes other apps out. Rule: load per job and unload after. Never keep it loaded all day.

Only `qwen3.6:35b-mlx` is downloaded. The 9B, the 4B and the embedding model are not.

## Sources

- [Apple: Mac mini specs](https://www.apple.com/mac-mini/specs/)
- [LLMCheck: Qwen3.6-35B-A3B on Mac](https://llmcheck.net/blog/qwen-36-35b-a3b-mac-new-number-one/)
- [Ollama: qwen3.6 tags](https://ollama.com/library/qwen3.6/tags), [qwen3.5 tags](https://ollama.com/library/qwen3.5/tags)
- [Ollama issue 18567](https://github.com/ollama/ollama/issues/18567)
- [Qwen3.6-35B-A3B model card](https://huggingface.co/Qwen/Qwen3.6-35B-A3B), [Qwen3.5-9B model card](https://huggingface.co/Qwen/Qwen3.5-9B)
- [Qwen3 Embedding paper](https://arxiv.org/pdf/2506.05176)
