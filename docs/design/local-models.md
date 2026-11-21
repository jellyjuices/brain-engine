# Local model add-on: one example setup

The brain needs no AI. A local model is an add-on, like the calendar, and it stays off until the owner turns it on in config. This page is one tested setup for a 32 GB Apple silicon home server, researched on 2026-11-20. Another owner may pick a smaller model or skip the add-on.

## The home server

- Hardware: Mac mini (Mac18,5), Apple M6, 12-core CPU, 12-core GPU, 32 GB unified memory, 170 GB/s memory bandwidth.
- Ollama 0.40.16 installed. Since 0.40, Ollama runs MLX builds by default on Apple silicon. GGUF builds still run on llama.cpp.
- The GPU may use about 75% of memory by default, so about 24 GB. Apple does not document this. Some sources say two thirds, about 21 GB.

## The pick: one large, one small (owner, 2026-11-21)

| Role | Model | Ollama tag | Download | Memory at 64k | Speed |
| --- | --- | --- | --- | --- | --- |
| Large: hard tasks, intake, split, enrich | Qwen3.6-35B-A3B (MoE, 3B active), Apache-2.0 | `qwen3.6:35b-mlx` | 23 GB | 25 GB | 40 to 85 tokens/s |
| Small: everyday coding, sort, short jobs | Qwen3.5-9B (dense), Apache-2.0 | `qwen3.5:9b-mlx` | 8.9 GB | 11 GB | about 23 tokens/s |

- macOS and the other apps use about 7 GB. With the large model at 64k, the home server is full and spills into swap. With the small one, about 14 GB stays free.
- The small model is slower than the large one: a dense 9B reads all 9B weights for each token, the MoE reads only 3B.
- Only one model fits at a time. Ollama swaps them on demand, with a load wait.
- Search meaning could later use `qwen3-embedding:0.6b`, much stronger than today's `snowflake-arctic-embed-xs`. Not downloaded. The search index would need a rebuild.

Settings: `num_ctx` 65536, `think: false` for intake and JSON jobs, temperature 0.7 for intake and 0.2 for split. Always set `num_predict`, check the JSON, and retry once: an open Ollama bug (#18567) can make an MLX run print blank space until the cap.

Load on demand: `keep_alive` "10m" during an intake, "0" after the last background job. One model at a time.

## Rejected

- Too big for 32 GB: DeepSeek V4 (all sizes), Kimi K3, Kimi Linear 48B, GLM-5.3, GLM-4.5-Air, MiniMax M3, Hunyuan Hy4 Flash, LongCat-Flash-Lite.
- Too slow for a live turn in the app: Qwen3.8-27B (dense, about 8 tokens a second). Fine for an overnight job.
- No good fit: GLM-4.7-Flash (built for code), ERNIE 4.5 (2025, no Ollama tag).
- Tested and removed: Qwen3.5-4B (`qwen3.5:4b-mlx`). Code 7/10 (a date bug and a weak parser), one JSON reply that did not parse. 6.5 GB at 64k, 40 tokens/s.

## Test results

Tested on the home server (the Mac mini above) on 2026-11-20 and 21 with 18 made-up tasks (comprehension, dates, logic, split, sort, format rules, intake, summary, easy code):

- Machine-scored checks: the large model, the small model, Claude Haiku and Claude Sonnet all scored sort 15/15, format rules 11/11, code 10/10, all JSON valid. The 4B scored code 7/10.
- Written answers, scored blind by a grader agent out of 37: Sonnet 37, Haiku 36, large 33, small 29, 4B 25. Totals out of 73: Sonnet 73, Haiku 72, large 69, small 65, 4B 58.
- Where the Qwen models lost points, with thinking off: a logic puzzle and date sums (large and small), people reasoning (small), frontmatter format (small). Writing, splitting journal entries, intake questions and summaries scored close to Claude. Try `think: true` for jobs that need reasoning; not tested yet.
- Context, filled with real text on the large model: 32k used 24 GB, 64k used 25 GB, 128k used 27 GB and grew swap by 1.5 GB. Reading a full 64k takes about 72 s; 128k takes about 4 minutes. 64k is the best size for 32 GB.
- Ollama runs with `OLLAMA_KV_CACHE_TYPE=q8_0` and `OLLAMA_FLASH_ATTENTION=1` (set with `launchctl setenv`, lost at reboot). [UNCERTAIN: whether the MLX runner uses them; there is no full-context number from before.]

Large model details:
- 40 to 85 tokens a second. Most replies took 0.5 to 2.5 seconds.
- Cold start: 12 s to load, 23 s to read the first prompt. Warm up the model before the owner waits on it.
- `ollama ps`: 25 GB, 100% GPU, MLX runner.
- Memory: swap grew from 0.75 GB to 12.7 GB while loaded. The model fits, but it pushes other apps out. Rule: load per job and unload after. Never keep it loaded all day.

Downloaded: `qwen3.6:35b-mlx` and `qwen3.5:9b-mlx`, about 30 GB on disk.

## Sources

- [Apple: Mac mini specs](https://www.apple.com/mac-mini/specs/)
- [LLMCheck: Qwen3.6-35B-A3B on Mac](https://llmcheck.net/blog/qwen-36-35b-a3b-mac-new-number-one/)
- [Ollama: qwen3.6 tags](https://ollama.com/library/qwen3.6/tags), [qwen3.5 tags](https://ollama.com/library/qwen3.5/tags)
- [Ollama issue 18567](https://github.com/ollama/ollama/issues/18567)
- [Qwen3.6-35B-A3B model card](https://huggingface.co/Qwen/Qwen3.6-35B-A3B), [Qwen3.5-9B model card](https://huggingface.co/Qwen/Qwen3.5-9B)
- [Qwen3 Embedding paper](https://arxiv.org/pdf/2506.05176)
