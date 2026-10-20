import gradio as gr
from modelscope.pipelines import pipeline
from modelscope.utils.constant import Tasks

model_id = "Qwen/Qwen2.5-0.5B-Instruct"

pipe = pipeline(
    task=Tasks.chat,
    model=model_id,
    device='cpu'
)

def respond(message,history):
    tokenizer = pipe.tokenizer
    prompt = tokenizer.apply_chat_template(
        [{"role":"user","content":message}],
        tokenize=False,
        add_generation_prompt=True
    )
    outputs = pipe(prompt, max_new_tokens=256)
    return outputs['text']

demo = gr.ChatInterface(
    fn=respond,
    title="极简聊天",
    description="ChatBot机器人 "
)

if __name__ == "__main__":
  demo.launch()