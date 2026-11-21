# Local models on the Mac mini

Research for roadmap step R2, 2026-11-20. Nothing is downloaded yet. The test below decides the final pick.

## The machine

- Mac mini (Mac18,5), Apple M6, 12-core CPU, 12-core GPU, 32 GB unified memory, 170 GB/s memory bandwidth.
- Ollama 0.40.16 installed. Since 0.40, Ollama runs MLX builds by default on Apple silicon. GGUF builds still run on llama.cpp.
- The GPU may use about 75% of memory by default, so about 24 GB. Apple does not document this. Some sources say two thirds, about 21 GB.

## The pick

| Job | Model | Ollama tag | Size | Why |
| --- | --- | --- | --- | --- |
| Intake, split, enrich | Qwen3.6-35B-A3B (MoE, 3B active), Apache-2.0 | `qwen3.6:35b-mlx` | 23 GB | Best quality that runs fast here: 59 to 64 tokens a second measured on an M6 Mac mini 32 GB |
| Fallback for the above | Qwen3.5-9B, Apache-2.0 | `qwen3.5:9b-mlx` | 8.9 GB | Use if the 35B does not fit on the GPU or makes the Mac swap. Best published instruction scores at a safe size (IFEval 91.5) |
| Sort fallback | Qwen3.5-4B, Apache-2.0 | `qwen3.5:4b-mlx` | 4.0 GB | Fast. Step up to the 9B if it guesses badly |
| Search meaning | Qwen3-Embedding-0.6B | `qwen3-embedding:0.6b` | about 0.6 GB | Much stronger than today's `snowflake-arctic-embed-xs`. The search index must be rebuilt |

Settings: `num_ctx` 32768 (16384 for sort), `think: false` for intake and JSON jobs, temperature 0.7 for intake and 0.2 for split. Always set `num_predict`, check the JSON, and retry once: an open Ollama bug (#18567) can make an MLX run print blank space until the cap.

Load on demand: `keep_alive` "10m" during an intake, "0" after the last background job. One model at a time.

## Rejected

- Too big for 32 GB: DeepSeek V4 (all sizes), Kimi K3, Kimi Linear 48B, GLM-5.3, GLM-4.5-Air, MiniMax M3, Hunyuan Hy4 Flash, LongCat-Flash-Lite.
- Too slow for a phone turn: Qwen3.8-27B (dense, about 8 tokens a second). Fine for an overnight job.
- No good fit: GLM-4.7-Flash (built for code), ERNIE 4.5 (2025, no Ollama tag).

## Unknown until tested

- Whether the 23 GB tag stays fully on the GPU under the default limit.
- How long a cold 16k prompt takes to read. Estimate 10 to 30 seconds on the 35B.
- JSON reliability on MLX.

## Test (after the owner says yes to about 37 GB of downloads)

1. `ollama pull qwen3.6:35b-mlx`, then the 9B, the 4B and the embedding model.
2. Note `sysctl vm.swapusage`.
3. `ollama run qwen3.6:35b-mlx --verbose "Write three warm, short intake questions about a new goal."`
4. `ollama ps`: the model must show 100% GPU. Swap must not grow.
5. Run 20 sample splits with a JSON schema through `/api/chat`. Pass: 20 of 20 valid, 50+ tokens a second.
6. If the 35B fails step 4 or 5, use the 9B for intake and split.

## Sources

- [Apple: Mac mini specs](https://www.apple.com/mac-mini/specs/)
- [LLMCheck: Qwen3.6-35B-A3B on Mac](https://llmcheck.net/blog/qwen-36-35b-a3b-mac-new-number-one/)
- [Ollama: qwen3.6 tags](https://ollama.com/library/qwen3.6/tags), [qwen3.5 tags](https://ollama.com/library/qwen3.5/tags)
- [Ollama issue 18567](https://github.com/ollama/ollama/issues/18567)
- [Qwen3.6-35B-A3B model card](https://huggingface.co/Qwen/Qwen3.6-35B-A3B), [Qwen3.5-9B model card](https://huggingface.co/Qwen/Qwen3.5-9B)
- [Qwen3 Embedding paper](https://arxiv.org/pdf/2506.05176)
