import java.io.UnsupportedEncodingException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.eclipse.lsp4j.Diagnostic;
import org.eclipse.lsp4j.DiagnosticSeverity;
import org.eclipse.lsp4j.Position;
import org.eclipse.lsp4j.PublishDiagnosticsParams;
import org.eclipse.lsp4j.Range;
import org.eclipse.lsp4j.TextDocumentIdentifier;
import org.eclipse.lsp4j.TextDocumentItem;

import repair.regen.api.CommandLineLauncher;
import repair.regen.errors.ErrorEmitter;
import repair.regen.errors.ErrorPosition;

public class LJDiagnostics {
	
	public static Optional<PublishDiagnosticsParams> checkDiagnostics(String root, TextDocumentItem textDocumentItem) {
		return verify(root, textDocumentItem.getUri());
	}
	

	public static Optional<PublishDiagnosticsParams> checkDiagnostics(String root, TextDocumentIdentifier textDocumentItem) {
		return verify(root, textDocumentItem.getUri());
	}
	
	
	public static Optional<PublishDiagnosticsParams> verify(String root, String uri){
		String u = root.substring(8);
		u = convertUTFtoCharacters(u);
		System.out.println("url in lsp: "+ u);
		ErrorEmitter ee;
		try {
			ee = CommandLineLauncher.launch(u);
		}catch(Exception e) {
			System.err.println("Exception:" + e.getMessage());
			return Optional.empty();
		}
		System.out.println("OnVerification");
		
		if(!ee.foundError()) {
			PublishDiagnosticsParams diagnosticsParams = new PublishDiagnosticsParams();
			List<Diagnostic> diagnostics = new ArrayList<>();
			diagnosticsParams.setDiagnostics(diagnostics);
			diagnosticsParams.setUri(uri);
			return Optional.of(diagnosticsParams);
		}
		ErrorPosition pos = ee.getPosition();
		
		PublishDiagnosticsParams diagnosticsParams = new PublishDiagnosticsParams();
		List<Diagnostic> diagnostics = new ArrayList<>();
        Range range = new Range(
                new Position(pos.getLineStart()-1, pos.getColStart()-1),
                new Position(pos.getLineEnd()-1, pos.getColEnd()-1)
        );
        String msg = ee.getTitleMessage()+"\n"+ee.getFullMessage();
        //String posss = String.format("(%d,%d) (%d,%d)", pos.getLineStart(), pos.getColStart(), pos.getLineEnd(), pos.getColEnd());
        diagnostics.add(new Diagnostic(range, "Refinement Type Error",  
        		DiagnosticSeverity.Error, msg));
        diagnosticsParams.setDiagnostics(diagnostics);
        diagnosticsParams.setUri(ee.getFilePath().toString());
		return Optional.of(diagnosticsParams);
	}
	
	

	private static String convertUTFtoCharacters(String source) {	
		try {
		    String result = java.net.URLDecoder.decode(source, StandardCharsets.UTF_8.name());
		    return result;
		} catch (UnsupportedEncodingException e) {
		    // not going to happen - value came from JDK's own StandardCharsets
		}
		return null;
	}
}
