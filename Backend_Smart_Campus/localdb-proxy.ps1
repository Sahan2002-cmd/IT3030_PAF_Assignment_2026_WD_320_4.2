param([string]$pipePath)

$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, 0)
$listener.Start()
$port = [int]$listener.LocalEndpoint.Port

# Flush out the output so Java can read it immediately
[Console]::Out.WriteLine("PROXY_PORT=$port")
[Console]::Out.Flush()

try {
    while ($true) {
        if ($listener.Pending()) {
            $client = $listener.AcceptTcpClient()
            $stream = $client.GetStream()
            
            $pipe = [System.IO.Pipes.NamedPipeClientStream]::new(".", $pipePath, [System.IO.Pipes.PipeDirection]::InOut, [System.IO.Pipes.PipeOptions]::Asynchronous)
            try {
                $pipe.Connect(5000)
                $task1 = $stream.CopyToAsync($pipe)
                $task2 = $pipe.CopyToAsync($stream)
            } catch {
                $client.Close()
            }
        }
        Start-Sleep -Milliseconds 100
    }
} finally {
    $listener.Stop()
}
