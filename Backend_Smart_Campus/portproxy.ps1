using namespace System.Net.Sockets
using namespace System.Net
using namespace System.IO.Pipes

$pipeName = "LOCALDB#4350F2F2\tsql\query"
$listener = [TcpListener]::new([IPAddress]::Loopback, 14330)
$listener.Start()
Write-Output "Proxy started on port 14330 for pipe $pipeName"

while ($true) {
    if ($listener.Pending()) {
        $client = $listener.AcceptTcpClient()
        $stream = $client.GetStream()
        
        $pipe = [NamedPipeClientStream]::new(".", $pipeName, [PipeDirection]::InOut, [PipeOptions]::Asynchronous)
        try {
            $pipe.Connect(5000)
            Write-Output "Pipe Connected!"
            
            $buf1 = New-Object byte[] 8192
            $buf2 = New-Object byte[] 8192
            
            $task1 = $stream.CopyToAsync($pipe)
            $task2 = $pipe.CopyToAsync($stream)
            
            # Fire and forget (this is just for testing)
        } catch {
            Write-Output "Pipe connection failed: $_"
            $client.Close()
        }
    }
    Start-Sleep -Milliseconds 100
}
