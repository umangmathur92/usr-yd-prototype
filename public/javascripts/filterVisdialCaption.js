var filterDict = ["<unk>","can't tell"]; 
[Unit]
Description=worker viscap service %i

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/new/visual-chatbot
Environment="CUDA_VISIBLE_DEVICES=0"
ExecStart=/home/ubuntu/miniconda2/envs/new-vischat/bin/python worker_viscap.py --gpu-ids 0
ExecReload=/bin/kill -s HUP $MAINPID
ExecStop=/bin/kill -s TERM $MAINPID
Restart=on-abort
PrivateTmp=true

[Install]
WantedBy=multi-user.target