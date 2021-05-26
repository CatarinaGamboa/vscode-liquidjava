import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;

import org.eclipse.lsp4j.CodeActionParams;
import org.eclipse.lsp4j.CodeLens;
import org.eclipse.lsp4j.CodeLensParams;
import org.eclipse.lsp4j.Command;
import org.eclipse.lsp4j.CompletionItem;
import org.eclipse.lsp4j.CompletionItemKind;
import org.eclipse.lsp4j.CompletionList;
import org.eclipse.lsp4j.CompletionParams;
import org.eclipse.lsp4j.DidChangeConfigurationParams;
import org.eclipse.lsp4j.DidChangeTextDocumentParams;
import org.eclipse.lsp4j.DidChangeWatchedFilesParams;
import org.eclipse.lsp4j.DidCloseTextDocumentParams;
import org.eclipse.lsp4j.DidOpenTextDocumentParams;
import org.eclipse.lsp4j.DidSaveTextDocumentParams;
import org.eclipse.lsp4j.DocumentFormattingParams;
import org.eclipse.lsp4j.DocumentHighlight;
import org.eclipse.lsp4j.DocumentLink;
import org.eclipse.lsp4j.DocumentLinkParams;
import org.eclipse.lsp4j.DocumentOnTypeFormattingParams;
import org.eclipse.lsp4j.DocumentRangeFormattingParams;
import org.eclipse.lsp4j.DocumentSymbolParams;
import org.eclipse.lsp4j.Hover;
import org.eclipse.lsp4j.Location;
import org.eclipse.lsp4j.PublishDiagnosticsParams;
import org.eclipse.lsp4j.ReferenceParams;
import org.eclipse.lsp4j.RenameParams;
import org.eclipse.lsp4j.SignatureHelp;
import org.eclipse.lsp4j.SymbolInformation;
import org.eclipse.lsp4j.TextDocumentIdentifier;
import org.eclipse.lsp4j.TextDocumentItem;
import org.eclipse.lsp4j.TextDocumentPositionParams;
import org.eclipse.lsp4j.TextEdit;
import org.eclipse.lsp4j.VersionedTextDocumentIdentifier;
import org.eclipse.lsp4j.WorkspaceEdit;
import org.eclipse.lsp4j.WorkspaceSymbolParams;
import org.eclipse.lsp4j.jsonrpc.RemoteEndpoint;
import org.eclipse.lsp4j.jsonrpc.messages.Either;
import org.eclipse.lsp4j.services.LanguageClient;
import org.eclipse.lsp4j.services.TextDocumentService;
import org.eclipse.lsp4j.services.WorkspaceService;

public class LJTextDocumentService implements TextDocumentService, WorkspaceService {
	private LanguageClient remoteProxy;
	private RemoteEndpoint remoteEndPoint;
	private String workspaceRoot;
//	 private final BroadcastingArchetypeRepository storage = new BroadcastingArchetypeRepository(this);
	
	
	public void setWorkspaceRoot(String s) {
		if(!s.contains("/src"))
			s = s+"/src";
		workspaceRoot = s;
	}

	public void checkDiagnostics(TextDocumentItem textDocumentItem) {
		Optional<PublishDiagnosticsParams> oparams = LJDiagnostics.checkDiagnostics(workspaceRoot,textDocumentItem);
		if(oparams.isPresent())
			remoteProxy.publishDiagnostics(oparams.get());
		else
			remoteProxy.publishDiagnostics(new PublishDiagnosticsParams());
		
	}
	

	private void checkDiagnostics(VersionedTextDocumentIdentifier textDocument) {
		Optional<PublishDiagnosticsParams> oparams = LJDiagnostics.checkDiagnostics(workspaceRoot, textDocument);
		if(oparams.isPresent())
			remoteProxy.publishDiagnostics(oparams.get());
		else
			remoteProxy.publishDiagnostics(null);
		
	}

	public void setRemoteProxy(LanguageClient remoteProxy) {
		this.remoteProxy = remoteProxy;
	}

	public void setRemoteEndPoint(RemoteEndpoint remoteEndpoint) {
		this.remoteEndPoint = remoteEndpoint;
	}

	@Override
	public CompletableFuture<Either<List<CompletionItem>, CompletionList>> completion(CompletionParams position) {
		// Provide completion item.
		System.out.println("on completion");
		return CompletableFuture.supplyAsync(() -> {
			List<CompletionItem> completionItems = new ArrayList<>();
			try {
				CompletionItem req = new CompletionItem();
				req.setInsertText("@Refinement()");
				req.setLabel("@Refinement");
				req.setKind(CompletionItemKind.Snippet);
				req.setDetail("Refinement annotation");
				
				
				// Add the sample completion item to the list.
				completionItems.add(req);
			} catch (Exception e) {
				//TODO: Handle the exception.
			}

			// Return the list of completion items.
			return Either.forLeft(completionItems);
		});
	}

	@Override
	public CompletableFuture<CompletionItem> resolveCompletionItem(CompletionItem unresolved) {
		// TODO Auto-generated method stub
		System.out.println("on resolveCompletionItem");
		return CompletableFuture.supplyAsync(() -> {
			return new CompletionItem();
		});
	}

	@Override
	public CompletableFuture<Hover> hover(TextDocumentPositionParams position) {
		position.getPosition().getCharacter();
		System.out.println("on hover");
		return  CompletableFuture.supplyAsync(() -> {
			return null;//new Hover();
		});
	}

	@Override
	public CompletableFuture<SignatureHelp> signatureHelp(TextDocumentPositionParams position) {
		System.out.println("on signatureHelp");
		return CompletableFuture.supplyAsync(() -> {
			return new SignatureHelp();
		});
	}

	@Override
	public CompletableFuture<List<? extends Location>> definition(TextDocumentPositionParams position) {
		// TODO Auto-generated method stub
		System.out.println("on definition");
		return CompletableFuture.supplyAsync(() -> {
			Location t = new Location();
			return Arrays.asList(t);
		});
	}

	@Override
	public CompletableFuture<List<? extends Location>> references(ReferenceParams params) {
		// TODO Auto-generated method stub
		System.out.println("on references");
		return CompletableFuture.supplyAsync(() -> {
			Location l = new Location();
			return Arrays.asList(l);
		});
	}

	@Override
	public CompletableFuture<List<? extends DocumentHighlight>> documentHighlight(TextDocumentPositionParams position) {
		// TODO Auto-generated method stub
		System.out.println("on documentHighlight");
		return CompletableFuture.supplyAsync(() -> {
			DocumentHighlight l = new DocumentHighlight();
			return Arrays.asList(l);
		});
	}

	@Override
	public CompletableFuture<List<? extends SymbolInformation>> documentSymbol(DocumentSymbolParams params) {
		// TODO Auto-generated method stub
		System.out.println("on documentSymbol");
		return CompletableFuture.supplyAsync(() -> {
			SymbolInformation t = new SymbolInformation();
			return Arrays.asList(t);
		});
	}

	@Override
	public CompletableFuture<List<? extends Command>> codeAction(CodeActionParams params) {
		// TODO Auto-generated method stub
		System.out.println("on codeAction");
		return CompletableFuture.supplyAsync(() -> {
			Command l = new Command();
			return Arrays.asList(l);
		});
	}

	@Override
	public CompletableFuture<List<? extends CodeLens>> codeLens(CodeLensParams params) {
		// TODO Auto-generated method stub
		System.out.println("on code lens");
		return CompletableFuture.supplyAsync(() -> {
			CodeLens t = new CodeLens();
			return Arrays.asList(t);
		});
	}

	@Override
	public CompletableFuture<CodeLens> resolveCodeLens(CodeLens unresolved) {
		// TODO Auto-generated method stub
		System.out.println("on resolveCodeLens");
		return CompletableFuture.supplyAsync(() -> {
			CodeLens l = new CodeLens();
			return l;
		});
	}

	@Override
	public CompletableFuture<List<? extends TextEdit>> formatting(DocumentFormattingParams params) {
		// TODO Auto-generated method stub
		System.out.println("on formatting");
		return CompletableFuture.supplyAsync(() -> {
			TextEdit t = new TextEdit();
			return Arrays.asList(t);
		});
	}

	@Override
	public CompletableFuture<List<? extends TextEdit>> rangeFormatting(DocumentRangeFormattingParams params) {
		// TODO Auto-generated method stub
		System.out.println("on rangeFormatting");
		return CompletableFuture.supplyAsync(() -> {
			TextEdit t = new TextEdit();
			return Arrays.asList(t);
		});
	}

	@Override
	public CompletableFuture<List<? extends TextEdit>> onTypeFormatting(DocumentOnTypeFormattingParams params) {
		// TODO Auto-generated method stub
		System.out.println("on typeformatting");
		return null;
	}

	@Override
	public CompletableFuture<WorkspaceEdit> rename(RenameParams params) {
		// TODO Auto-generated method stub
		System.out.println("on rename");
		return CompletableFuture.supplyAsync(() -> {
			WorkspaceEdit t = new WorkspaceEdit();
			return t;
		});
	}

	@Override
	public void didOpen(DidOpenTextDocumentParams params) {
		// TODO Auto-generated method stub
		checkDiagnostics(params.getTextDocument());
	}

	@Override
	public void didChange(DidChangeTextDocumentParams params) {
		// TODO Auto-generated method stub
		System.out.println("on didChange doc");
		System.out.println();
		checkDiagnostics(params.getTextDocument());
	}


	@Override
	public void didClose(DidCloseTextDocumentParams params) {
		// TODO Auto-generated method stub
		System.out.println("on didClose");
	}

	@Override
	public void didSave(DidSaveTextDocumentParams params) {
		// TODO Auto-generated method stub
		System.out.println("didSave");
	}

	@Override
	public CompletableFuture<List<? extends SymbolInformation>> symbol(WorkspaceSymbolParams params) {
		// TODO Auto-generated method stub
		System.out.println("symbol");
		return null;
	}

	@Override
	public void didChangeConfiguration(DidChangeConfigurationParams params) {
		// TODO Auto-generated method stub
		System.out.println("on didChange config");
	}

	@Override
	public void didChangeWatchedFiles(DidChangeWatchedFilesParams params) {
		System.out.println("on didChange");
		// TODO Auto-generated method stub

	}
	
    @Override
    public CompletableFuture<List<DocumentLink>> documentLink(DocumentLinkParams params) {
    	System.out.println("on documentLink");
		return CompletableFuture.supplyAsync(() -> {
			DocumentLink s = new DocumentLink();
			return Arrays.asList(s);
		});
    }
    


}
